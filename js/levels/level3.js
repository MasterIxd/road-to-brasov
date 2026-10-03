// Level 3: Zelda-style dungeon in Bran Castle. Find the key to Brasov, shoo the bears.
(function () {
  const T = 16, OY = 32; // map starts below the HUD
  // Harder maze: the key sits in a pocket that is only reachable through the right wing,
  // the door is on the far side of a loop. 'S' = stone tablet with a message.
  const MAP = [
    'XXXXXXXXXXXXXDXX',
    'XS.X.......X...X',
    'X.XX.XXXXX.X.X.X',
    'X....X...X.....X',
    'XXXX.X.X.XXXXX.X',
    'X....X.X.......X',
    'X.XXXX.XXXXX.X.X',
    'X....K.X.......X',
    'X.XXXXXX.XXXXS.X',
    'X...X....X...X.X',
    'X.X.X.XXXX.X.X.X',
    'X.X...P....X...X',
    'XXXXXXXXXXXXXXXX',
  ];
  const SLIMES = [[2, 3], [7, 1], [11, 5], [11, 9], [14, 4]];
  // stone tablets: what the castle knows about the two cities
  const SIGNS = {
    '1,1': 'TABLET: BRASOV TO THE SKI SLOPE: 20 MIN. BUCHAREST: 3 HOURS.',
    '13,8': 'TABLET: BEARS IN BRASOV: MANY. PARKING IN BUCHAREST: NONE.',
  };

  function find(ch) {
    for (let y = 0; y < MAP.length; y++) { const x = MAP[y].indexOf(ch); if (x >= 0) return [x, y]; }
    return null;
  }

  Game.levels[2] = function () {
    const grid = MAP.map(r => r.split('').map(c => (c === 'P' || c === 'K' || c === 'S') ? '.' : c));
    const signs = Object.keys(SIGNS).map(k => { const [x, y] = k.split(',').map(Number); return { x: x * T + 2, y: y * T + OY + 2, w: 12, h: 12, text: SIGNS[k], read: false }; });
    const start = find('P'), keyPos = find('K'), doorPos = find('D');
    let p, slimes, hearts, hasKey = false, keyShow = 0, doorOpen = false;
    let msg = null, msgT = 0, state = 'play', stateT = 0, swing = 0, poofs = [];
    let turn = 'x'; // axis of the direction pressed last: with two directions held it is tried first

    const blocked = (tx, ty) => {
      if (ty < 0) return false;
      const c = (grid[ty] || [])[tx];
      return c === 'X' || c === undefined || (c === 'D' && !doorOpen);
    };
    const hits = b => {
      const l = Math.floor(b.x / T), r = Math.floor((b.x + b.w - 1) / T);
      const t = Math.floor((b.y - OY) / T), d = Math.floor((b.y + b.h - 1 - OY) / T);
      for (let ty = t; ty <= d; ty++) for (let tx = l; tx <= r; tx++) if (blocked(tx, ty)) return true;
      return false;
    };
    // move with wall sliding; returns true if blocked
    function moveBox(b, dx, dy) {
      let stuck = false;
      b.x += dx; if (hits(b)) { b.x -= dx; stuck = true; }
      b.y += dy; if (hits(b)) { b.y -= dy; stuck = true; }
      return stuck;
    }

    // The hero walks along lanes: one line through the middle of each row and column, no sideways slack.
    // LX / LY = where the 10x10 hero box sits inside a tile when it is on the lane.
    const LX = 3, LY = 5;
    const col = () => Math.round((p.x - LX) / T), row = () => Math.round((p.y - OY - LY) / T);
    // one step along a lane: line up with the row (or column) first, then go; returns false at a wall
    function walk(dx, dy, sp) {
      const c = col(), r = row(), lx = c * T + LX, ly = r * T + OY + LY;
      if (dx) {
        const wall = blocked(c + dx, r);
        if (wall && (lx - p.x) * dx <= 0) return false;
        const off = ly - p.y, m = Math.min(Math.abs(off), sp);
        if (m >= Math.abs(off)) p.y = ly; else p.y += Math.sign(off) * m;
        sp -= m;
        p.x += dx * sp;
        if (wall && (lx - p.x) * dx < 0) p.x = lx;
      } else {
        const wall = blocked(c, r + dy);
        if (wall && (ly - p.y) * dy <= 0) return false;
        const off = lx - p.x, m = Math.min(Math.abs(off), sp);
        if (m >= Math.abs(off)) p.x = lx; else p.x += Math.sign(off) * m;
        sp -= m;
        p.y += dy * sp;
        if (wall && (ly - p.y) * dy < 0) p.y = ly;
      }
      return true;
    }

    function reset() {
      p = { x: start[0] * T + LX, y: start[1] * T + OY + LY, w: 10, h: 10, face: 'down', anim: 0, inv: 0 };
      hearts = 3;
      slimes = SLIMES.map(([x, y]) => ({ x: x * T + 2, y: y * T + OY + 4, w: 12, h: 10, dx: 0, dy: 0, t: 0, alive: true, anim: Math.random() * 3 }));
    }
    reset();
    say('BEAR IN THE WAY? PRESS A TO SHOO IT!');

    function say(t) { msg = t; msgT = t.length > 30 ? 260 : 120; }
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    return {
      isLevel: true,
      fourWay: true, // needs up/down on the touch pad
      bg: '#000',
      music: 'dungeon',

      update() {
        stateT++;
        if (msgT > 0) msgT--;
        if (keyShow > 0) { keyShow--; return; }
        poofs = poofs.filter(f => ++f.t < 20);

        if (state === 'gameover') {
          if (stateT > 90) { state = 'play'; reset(); GameAudio.music('dungeon', true); }
          return;
        }
        if (state === 'exit') {
          p.y -= 0.8; p.face = 'up'; p.anim += 0.1;
          if (p.y < OY - 18) Game.clear('CASTLE CLEAR!');
          return;
        }

        // movement
        const I = Input.held;
        if (Input.pressed.left || Input.pressed.right) turn = 'x';
        if (Input.pressed.up || Input.pressed.down) turn = 'y';
        let dx = 0, dy = 0;
        if (swing <= 0) {
          if (I.left) dx = -1; else if (I.right) dx = 1;
          if (I.up) dy = -1; else if (I.down) dy = 1;
        }
        if (dx || dy) {
          const sp = 1.3;
          // two directions held: the one pressed last wins wherever the maze lets it (that is how you take a turn)
          let went = null;
          for (const axis of (turn === 'y' ? 'yx' : 'xy')) {
            if (axis === 'x' && dx && walk(dx, 0, sp)) { went = 'x'; break; }
            if (axis === 'y' && dy && walk(0, dy, sp)) { went = 'y'; break; }
          }
          if (!went) went = dy ? 'y' : 'x'; // at a wall: just turn to face it
          p.face = went === 'x' ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
          p.anim += 0.12;
        }
        if (p.inv > 0) p.inv--;

        // sword
        if ((Input.pressed.a || Input.pressed.b) && swing <= 0) { swing = 14; GameAudio.sfx('sword'); }
        let blade = null;
        if (swing > 0) {
          swing--;
          const F = { up: [p.x - 1, p.y - 18, 12, 18], down: [p.x - 1, p.y + p.h, 12, 18], left: [p.x - 18, p.y - 1, 18, 12], right: [p.x + p.w, p.y - 1, 18, 12] }[p.face];
          blade = { x: F[0], y: F[1], w: F[2], h: F[3] };
        }

        // key
        const kb = { x: keyPos[0] * T, y: keyPos[1] * T + OY, w: 16, h: 16 };
        if (!hasKey && Plat.overlap(p, kb)) {
          hasKey = true; keyShow = 70; GameAudio.sfx('item'); say('YOU GOT THE KEY TO ' + CONFIG.to + '!');
        }

        // stone tablets
        for (const sg of signs) {
          const on = Plat.overlap(p, sg);
          if (on && !sg.read) { sg.read = true; say(sg.text); GameAudio.sfx('select'); }
          if (!on) sg.read = false;
        }

        // door
        const db = { x: doorPos[0] * T, y: doorPos[1] * T + OY, w: 16, h: 18 };
        // the hero stays on the lane below the door, so the door answers to pushing up at it
        const atDoor = col() === doorPos[0] && row() === doorPos[1] + 1 && Input.held.up && swing <= 0;
        if (!doorOpen && atDoor) {
          if (hasKey) { doorOpen = true; GameAudio.sfx('door'); setTimeout(() => GameAudio.sfx('secret'), 250); state = 'exit'; GameAudio.stopMusic(); p.x = doorPos[0] * T + 3; }
          else if (msgT <= 0) { say('LOCKED. EVEN DRACULA LOCKS HIS DOOR.'); GameAudio.sfx('bump'); }
        }

        // slimes
        for (const s of slimes) {
          if (!s.alive) continue;
          s.anim += 0.1;
          if (--s.t <= 0) {
            const d = Math.random() < 0.25 ? [0, 0] : dirs[Math.floor(Math.random() * 4)];
            s.dx = d[0]; s.dy = d[1]; s.t = 50 + Math.random() * 70;
          }
          if (s.flee) {
            // shooed bear runs off and disappears
            s.x += s.fx * 2.2; s.y += s.fy * 2.2;
            if (++s.flee > 40) s.alive = false;
            continue;
          }
          if (moveBox(s, s.dx * 0.55, s.dy * 0.55)) s.t = 0;
          if (s.dx) s.face = s.dx;
          if (blade && Plat.overlap(blade, s)) {
            s.flee = 1;
            const ax = s.x - p.x, ay = s.y - p.y, len = Math.hypot(ax, ay) || 1;
            s.fx = ax / len; s.fy = ay / len;
            GameAudio.sfx('stomp');
            if (msgT <= 0) say('SHOO! GO BACK TO THE FOREST!');
            continue;
          }
          if (p.inv <= 0 && Plat.overlap(p, s)) {
            hearts--; p.inv = 70; GameAudio.sfx('hurt');
            // knockback away from slime
            const kx = Math.sign(p.x - s.x), ky = Math.sign(p.y - s.y);
            // along the lanes: away from the bear on the axis where it is further off, else on the other one
            const tries = Math.abs(p.x - s.x) >= Math.abs(p.y - s.y) ? [[kx, 0], [0, ky]] : [[0, ky], [kx, 0]];
            for (const [ax, ay] of tries) {
              if (!(ax || ay) || !walk(ax, ay, 3)) continue;
              for (let k = 0; k < 4; k++) walk(ax, ay, 3);
              break;
            }
            s.dx = -kx || s.dx; s.dy = -ky || s.dy; s.t = 60; // bear backs off
            if (hearts <= 0) { state = 'gameover'; stateT = 0; Game.fail(); GameAudio.stopMusic(); say('BEAR HUG! TRY AGAIN'); }
          }
        }
        this.blade = blade;
      },

      draw(ctx) {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, Game.W, Game.H);
        for (let y = 0; y < grid.length; y++)
          for (let x = 0; x < 16; x++) {
            const c = grid[y][x], X = x * T, Y = y * T + OY;
            if (c === 'X') {
              ctx.fillStyle = '#6c4c4c'; ctx.fillRect(X, Y, 16, 16);
              ctx.fillStyle = '#a07878'; ctx.fillRect(X, Y, 15, 2); ctx.fillRect(X, Y, 2, 15);
              ctx.fillStyle = '#3c2020'; ctx.fillRect(X + 1, Y + 14, 15, 2); ctx.fillRect(X + 14, Y + 1, 2, 15);
            } else if (c === 'D') {
              ctx.fillStyle = doorOpen ? '#000' : '#6c3c00'; ctx.fillRect(X, Y, 16, 16);
              if (!doorOpen) {
                ctx.fillStyle = '#a86800'; ctx.fillRect(X + 2, Y + 2, 12, 14);
                ctx.fillStyle = '#000'; ctx.fillRect(X + 7, Y + 7, 2, 2); ctx.fillRect(X + 7, Y + 9, 2, 3);
              }
            } else {
              ctx.fillStyle = '#e4c890'; ctx.fillRect(X, Y, 16, 16);
              ctx.fillStyle = '#d0b070';
              if ((x + y) % 2) ctx.fillRect(X + 4, Y + 5, 2, 2); else ctx.fillRect(X + 10, Y + 10, 2, 2);
            }
          }

        // stone tablets
        for (const sg of signs) {
          ctx.fillStyle = '#7c7c7c'; ctx.fillRect(sg.x, sg.y, 12, 13);
          ctx.fillStyle = '#bcbcbc'; ctx.fillRect(sg.x, sg.y, 11, 1); ctx.fillRect(sg.x, sg.y, 1, 12);
          ctx.fillStyle = '#3c3c3c'; for (let k = 0; k < 3; k++) ctx.fillRect(sg.x + 3, sg.y + 3 + k * 3, 6, 1);
        }

        // key
        if (!hasKey) {
          const bob = Math.sin(Game.t * 4) * 2;
          Sprites.draw(ctx, Sprites.key, keyPos[0] * T, keyPos[1] * T + OY + 4 + bob);
        }

        // slimes
        for (const s of slimes) {
          if (!s.alive) continue;
          const bob = Math.floor(s.anim) % 2;
          const img = (s.flee ? s.fx : s.face) < 0 ? Sprites.bearL : Sprites.bear;
          if (!(s.flee && Math.floor(s.flee / 3) % 2)) Sprites.draw(ctx, img, s.x - 2, s.y - 6 - bob);
          if (s.flee) Game.text('!', s.x + 4, s.y - 16, '#fcd000', 1, 'left', '#000');
        }
        for (const f of poofs) {
          ctx.fillStyle = '#fff';
          const r = f.t * 0.8;
          for (let k = 0; k < 6; k++) ctx.fillRect(f.x + Math.cos(k) * r * 1.5, f.y + Math.sin(k) * r * 1.5, 3, 3);
        }

        // player
        if (!(p.inv > 0 && Math.floor(p.inv / 4) % 2) && state !== 'gameover') {
          let img;
          if (p.face === 'up') img = Sprites.hero.back;
          else if (p.face === 'down') img = Sprites.hero.front;
          else {
            const set = p.face === 'left' ? Sprites.heroL : Sprites.hero;
            img = Math.floor(p.anim) % 2 ? set.walk1 : set.walk2;
          }
          if (keyShow > 0) img = Sprites.hero.front;
          Sprites.draw(ctx, img, p.x - 1, p.y - 6);
          if (keyShow > 0) Sprites.draw(ctx, Sprites.key, p.x - 3, p.y - 16);
        }

        // sword
        if (this.blade) {
          const b = this.blade;
          ctx.fillStyle = '#fcfcfc';
          if (p.face === 'up' || p.face === 'down') ctx.fillRect(b.x + 5, b.y, 3, b.h);
          else ctx.fillRect(b.x, b.y + 5, b.w, 3);
          ctx.fillStyle = '#a86800';
          if (p.face === 'up') ctx.fillRect(b.x + 3, b.y + b.h - 3, 7, 2);
          if (p.face === 'down') ctx.fillRect(b.x + 3, b.y + 1, 7, 2);
          if (p.face === 'left') ctx.fillRect(b.x + b.w - 3, b.y + 3, 2, 7);
          if (p.face === 'right') ctx.fillRect(b.x + 1, b.y + 3, 2, 7);
        }

        // HUD
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, Game.W, OY);
        Game.text('-LIFE-', 12, 6, '#d82800');
        for (let k = 0; k < 3; k++) Sprites.draw(ctx, k < hearts ? Sprites.heart : Sprites.heartEmpty, 12 + k * 10, 18);
        Game.text('KEY', 110, 6, '#fff');
        if (hasKey) Sprites.draw(ctx, Sprites.key, 106, 17); else Game.text('-', 116, 18, '#7c7c7c');
        Game.text('A = SHOO!', 248, 6, '#7c7c7c', 1, 'right');
        Game.text(CONFIG.name, 248, 18, '#fff', 1, 'right');

        if (msgT > 0 && msg) {
          const lines = Font.wrap(msg, 38);
          const w = Math.max(...lines.map(l => Font.width(l))) + 16;
          Game.box(128 - w / 2, 206 - lines.length * 10, w, 10 + lines.length * 10);
          lines.forEach((l, i) => Game.text(l, 128, 212 - lines.length * 10 + i * 10, '#fcd000', 1, 'center'));
        }
      },
    };
  };
})();
