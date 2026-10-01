// Shared side-scrolling physics for level 1 and the boss level.
(function () {
  const T = 16;
  const SOLID = new Set(['#', 'B', '?', 'u', 'X', 'T', 't']);

  const Plat = {
    T, SOLID,

    // map: {grid: [[char]], w, h}
    tileAt(map, tx, ty) {
      if (tx < 0 || tx >= map.w) return 'X';
      if (ty < 0 || ty >= map.h) return '.';
      return map.grid[ty][tx];
    },
    solid(map, tx, ty) { return SOLID.has(Plat.tileAt(map, tx, ty)); },

    // Move a box {x,y,w,h,vx,vy} through the map. Returns {hitHead: [tx,ty] | null}.
    move(map, b) {
      const res = { hitHead: null, hitWall: false };
      b.onGround = false;

      // horizontal
      b.x += b.vx;
      let top = Math.floor(b.y / T), bot = Math.floor((b.y + b.h - 1) / T);
      if (b.vx > 0) {
        const tx = Math.floor((b.x + b.w - 1) / T);
        for (let ty = top; ty <= bot; ty++) if (Plat.solid(map, tx, ty)) { b.x = tx * T - b.w; b.vx = 0; res.hitWall = true; break; }
      } else if (b.vx < 0) {
        const tx = Math.floor(b.x / T);
        for (let ty = top; ty <= bot; ty++) if (Plat.solid(map, tx, ty)) { b.x = (tx + 1) * T; b.vx = 0; res.hitWall = true; break; }
      }

      // vertical
      b.y += b.vy;
      const l = Math.floor(b.x / T), r = Math.floor((b.x + b.w - 1) / T);
      if (b.vy > 0) {
        const ty = Math.floor((b.y + b.h - 1) / T);
        for (let tx = l; tx <= r; tx++) if (Plat.solid(map, tx, ty)) { b.y = ty * T - b.h; b.vy = 0; b.onGround = true; break; }
      } else if (b.vy < 0) {
        const ty = Math.floor(b.y / T);
        // hit the tile closest to the box center first
        const cx = Math.floor((b.x + b.w / 2) / T);
        const order = [cx, l, r].filter((v, i, a) => a.indexOf(v) === i);
        for (const tx of order) if (Plat.solid(map, tx, ty)) { b.y = (ty + 1) * T; b.vy = 0; res.hitHead = [tx, ty]; break; }
      }
      return res;
    },

    createPlayer(x, y) {
      return { x, y, w: 10, h: 15, vx: 0, vy: 0, onGround: false, face: 1, anim: 0, dead: 0, inv: 0 };
    },

    // input-driven player physics. Returns move() result.
    updatePlayer(map, p) {
      const I = Input.held;
      const run = 2.1; // one speed, no run button
      if (I.left) { p.vx = Math.max(p.vx - 0.2, -run); p.face = -1; }
      else if (I.right) { p.vx = Math.min(p.vx + 0.2, run); p.face = 1; }
      else { p.vx *= p.onGround ? 0.8 : 0.95; if (Math.abs(p.vx) < 0.05) p.vx = 0; }

      // forgiving jump: a press up to 8 frames before landing still counts,
      // and so does one up to 6 frames after running off a ledge
      if (Input.pressed.a) p.jumpBuf = 8; else if (p.jumpBuf > 0) p.jumpBuf--;
      if (p.onGround) p.coyote = 6; else if (p.coyote > 0) p.coyote--;
      if (p.jumpBuf > 0 && p.coyote > 0) { p.vy = -7; p.jumpBuf = 0; p.coyote = 0; p.jumpT = 0; GameAudio.sfx('jump'); }
      p.jumpT = (p.jumpT || 0) + 1;
      if (!I.a && p.vy < -2.5 && p.jumpT > 6) p.vy = -2.5; // lower jump when A is let go early; a quick tap still jumps ~3 blocks
      p.vy = Math.min(p.vy + 0.34, 6);

      const res = Plat.move(map, p);
      p.anim += Math.abs(p.vx) * 0.12;
      if (p.inv > 0) p.inv--;
      return res;
    },

    drawPlayer(ctx, p, camX) {
      if (p.inv > 0 && Math.floor(p.inv / 4) % 2) return;
      const set = p.face > 0 ? Sprites.hero : Sprites.heroL;
      let img = set.stand;
      if (p.dead) img = set.jump;
      else if (!p.onGround) img = set.jump;
      else if (Math.abs(p.vx) > 0.2) img = Math.floor(p.anim) % 2 ? set.walk1 : set.walk2;
      Sprites.draw(ctx, img, p.x - 1 - camX, p.y - 1);
    },

    overlap(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    },

    // parse a list of strings into a grid
    parse(rows) {
      const h = rows.length, w = Math.max(...rows.map(r => r.length));
      const grid = rows.map(r => r.padEnd(w, '.').split(''));
      return { grid, w, h };
    },

    drawTiles(ctx, map, camX, t) {
      const x0 = Math.floor(camX / T), x1 = x0 + Math.ceil(Game.W / T) + 1;
      for (let ty = 0; ty < map.h; ty++)
        for (let tx = x0; tx <= x1; tx++) {
          const c = Plat.tileAt(map, tx, ty);
          const x = tx * T - Math.round(camX), y = ty * T;
          if (c === '#') Sprites.tile.ground(ctx, x, y);
          else if (c === 'B') Sprites.tile.brick(ctx, x, y);
          else if (c === '?') Sprites.tile.question(ctx, x, y, t);
          else if (c === 'u') Sprites.tile.used(ctx, x, y);
          else if (c === 'X') Sprites.tile.stone(ctx, x, y);
          else if (c === 'T' || c === 't') Plat.drawPipe(ctx, map, tx, ty, x, y);
        }
    },

    // 'T' = pipe top row, 't' = pipe body. Pipes are 2 tiles wide, left half is where the letter starts.
    drawPipe(ctx, map, tx, ty, x, y) {
      const leftHalf = Plat.tileAt(map, tx - 1, ty) !== map.grid[ty][tx] || (tx - Plat.pipeStart(map, tx, ty)) % 2 === 0;
      const top = map.grid[ty][tx] === 'T';
      ctx.fillStyle = '#00a800';
      if (top) {
        ctx.fillRect(x - (leftHalf ? 2 : 0), y, leftHalf ? 18 : 18, 16);
        ctx.fillStyle = '#80d010'; if (leftHalf) ctx.fillRect(x + 2, y + 2, 4, 12);
        ctx.fillStyle = '#000'; ctx.fillRect(x - (leftHalf ? 2 : 0), y + 15, 18, 1);
        if (leftHalf) ctx.fillRect(x - 2, y, 1, 16); else ctx.fillRect(x + 15, y, 1, 16);
      } else {
        ctx.fillRect(x, y, 16, 16);
        ctx.fillStyle = '#80d010'; if (leftHalf) ctx.fillRect(x + 4, y, 4, 16);
        ctx.fillStyle = '#000'; if (leftHalf) ctx.fillRect(x, y, 1, 16); else ctx.fillRect(x + 15, y, 1, 16);
      }
    },
    pipeStart(map, tx, ty) {
      const c = map.grid[ty][tx];
      while (tx > 0 && map.grid[ty][tx - 1] === c) tx--;
      return tx;
    },
  };

  window.Plat = Plat;
})();
