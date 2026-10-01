// Level 1: Mario-style platformer. Collect 10 coins, reach the flag.
(function () {
  const T = Plat.T;
  const COINS_NEEDED = 10;
  const MAP_W = 112, MAP_H = 15;
  const FLAG_X = 101;

  function buildMap() {
    const rows = [];
    for (let y = 0; y < MAP_H; y++) rows.push(new Array(MAP_W).fill('.'));
    const set = (x, y, c) => { if (x >= 0 && x < MAP_W && y >= 0 && y < MAP_H) rows[y][x] = c; };

    // ground with 3 small gaps
    const gaps = [[29, 30], [57, 59], [83, 84]];
    for (let x = 0; x < MAP_W; x++) {
      if (gaps.some(([a, b]) => x >= a && x <= b)) continue;
      set(x, 13, '#'); set(x, 14, '#');
    }

    // blocks: ? gives a coin
    set(12, 9, '?');
    for (let x = 18; x <= 22; x++) set(x, 9, x % 2 ? '?' : 'B');
    set(20, 5, '?');
    set(44, 9, '?'); set(45, 9, 'B'); set(46, 9, '?');
    for (let x = 64; x <= 71; x++) set(x, 9, 'B');
    set(66, 9, '?'); set(69, 9, '?');
    for (let x = 66; x <= 69; x++) set(x, 5, 'B');
    set(76, 9, '?');

    // pipes (2 wide)
    const pipe = (x, h) => {
      for (let k = 0; k < h; k++) { const c = k === 0 ? 'T' : 't'; set(x, 13 - h + k, c); set(x + 1, 13 - h + k, c); }
    };
    pipe(34, 2); pipe(40, 3); pipe(50, 2);

    // stairs before the flag
    for (let s = 0; s < 4; s++) for (let k = 0; k <= s; k++) set(90 + s, 12 - k, 'X');
    for (let k = 0; k < 4; k++) set(94, 12 - k, 'X');
    set(FLAG_X, 12, 'X');

    return rows;
  }

  // floating coins: [x, y] in tiles
  const COINS = [
    [7, 10], [8, 10], [9, 10],
    [25, 8], [26, 7], [27, 8],
    [29, 10], [30, 10],
    [37, 9], [38, 9],
    [53, 10], [54, 10], [55, 10],
    [58, 9],
    [66, 4], [67, 4], [68, 4], [69, 4],
    [79, 10], [80, 10], [81, 10],
    [86, 10], [87, 10],
  ];

  const ENEMIES = [17, 27, 44, 54, 62, 70, 78, 87];
  const CHECKPOINT = 61;

  function lerpColor(a, b, t) {
    const pa = a.match(/\w\w/g).map(v => parseInt(v, 16)), pb = b.match(/\w\w/g).map(v => parseInt(v, 16));
    return 'rgb(' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',') + ')';
  }
  function drawFir(ctx, x, y, size) {
    const h = 14 + size * 6;
    ctx.fillStyle = '#006800';
    ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x - 7 - size, y); ctx.lineTo(x + 7 + size, y); ctx.fill();
    ctx.fillStyle = '#00a844';
    ctx.beginPath(); ctx.moveTo(x, y - h + 6); ctx.lineTo(x - 4 - size, y - 4); ctx.lineTo(x + 4 + size, y - 4); ctx.fill();
    ctx.fillStyle = '#503000'; ctx.fillRect(x - 1, y, 3, 8);
  }

  function S_parl(bx) {
    const ctx = Game.ctx;
    Sprites.parliament(ctx, bx - 10, 138);
  }

  Game.levels[0] = function () {
    const map = Plat.parse(buildMap().map(r => r.join('')));
    const xm = /[?&]x=(\d+)/.exec(location.search); // ?x=TILE starts further along the level, for testing
    let p, camX = 0, coins = 0, enemies, coinObjs, pops = [], respawnX = xm ? Math.min(MAP_W - 12, parseInt(xm[1], 10)) : 3, msg = null, msgT = 0;
    let state = 'play', stateT = 0, gotCheckpoint = false, sawMountains = false;

    function spawnEnemies() {
      enemies = ENEMIES.map(tx => ({ x: tx * T, y: 12 * T - 2, w: 14, h: 14, vx: -0.45, vy: 0, alive: true, flat: 0, anim: 0 }));
    }

    function reset() {
      p = Plat.createPlayer(respawnX * T, 12 * T - 15);
      p.inv = 90;
      spawnEnemies();
      camX = Math.max(0, p.x - lead());
    }

    coinObjs = COINS.map(([x, y]) => ({ x: x * T + 3, y: y * T + 1, w: 10, h: 14, taken: false }));
    reset();
    p.inv = 0;

    function addCoin(x, y) {
      coins++;
      GameAudio.sfx('coin');
      if (x !== undefined) pops.push({ x, y, t: 0 });
    }

    function die() {
      if (state !== 'play') return;
      state = 'dead'; stateT = 0;
      p.dead = 1; p.vy = -5; p.vx = 0;
      GameAudio.stopMusic();
      GameAudio.sfx('hurt');
      Game.fail();
    }

    function say(text) { msg = text; msgT = 150; }
    // where the hero stands on screen: a bit left of center
    function lead() { return Math.round(Game.W * 0.38); }

    return {
      isLevel: true,
      wide: true, // scrolls: uses the whole canvas width on a wide screen
      music: 'overworld',

      update() {
        stateT++;
        if (msgT > 0) msgT--;
        for (const pp of pops) pp.t++;
        pops = pops.filter(pp => pp.t < 30);

        if (state === 'dead') {
          p.vy += 0.3; p.y += p.vy;
          if (stateT > 90) { state = 'play'; reset(); GameAudio.music('overworld', true); }
          return;
        }

        if (state === 'flag') {
          // slide down the pole, then walk to the castle
          if (p.y < 12 * T - 15) { p.y += 2; }
          else if (stateT > 40) {
            p.x += 1; p.face = 1; p.anim += 0.15; p.vx = 1; p.onGround = true;
            if (p.x > FLAG_X * T + 16) p.y = Math.min(p.y + 3, 13 * T - 15);
          }
          if (p.x > (FLAG_X + 6) * T) Game.clear('TICKET BOUGHT!');
          return;
        }

        const res = Plat.updatePlayer(map, p);
        if (res.hitHead) {
          const [tx, ty] = res.hitHead;
          const c = map.grid[ty][tx];
          if (c === '?') { map.grid[ty][tx] = 'u'; addCoin(tx * T + 3, ty * T - 16); }
          else GameAudio.sfx('bump');
          // bumping a block from below also knocks out an enemy standing on it
          for (const e of enemies) if (e.alive && !e.flat && Math.abs(e.x + 7 - (tx * T + 8)) < 14 && Math.abs(e.y + e.h - ty * T) < 3) { e.flat = 1; GameAudio.sfx('stomp'); }
        }
        if (p.x < 0) p.x = 0;
        if (p.y > MAP_H * T) { die(); return; }

        // checkpoint
        if (!gotCheckpoint && p.x > CHECKPOINT * T) { gotCheckpoint = true; respawnX = CHECKPOINT; say('CHECKPOINT! STILL BUCHAREST...'); GameAudio.sfx('confirm'); }

        if (!sawMountains && p.x > 76 * T) { sawMountains = true; say('LOOK! THE MOUNTAINS! FRESH AIR!'); }

        // coins
        for (const c of coinObjs) if (!c.taken && Plat.overlap(p, c)) { c.taken = true; addCoin(); }

        // enemies
        for (const e of enemies) {
          if (!e.alive) continue;
          if (e.flat) { if (++e.flat > 30) e.alive = false; continue; }
          if (Math.abs(e.x - p.x) > Game.W) continue; // sleep until near
          e.vy = Math.min(e.vy + 0.3, 5);
          const before = e.vx;
          const r = Plat.move(map, e);
          if (r.hitWall) e.vx = -before;
          // turn around at ledges
          if (e.onGround) {
            const aheadX = e.vx < 0 ? e.x - 1 : e.x + e.w;
            if (!Plat.solid(map, Math.floor(aheadX / T), Math.floor((e.y + e.h + 1) / T))) e.vx = -e.vx;
          }
          e.anim += 0.08;
          if (e.y > MAP_H * T) e.alive = false;

          if (Plat.overlap(p, e)) {
            if (p.vy > 0 && p.y + p.h - e.y < 9) {
              e.flat = 1; p.vy = Input.held.a ? -6 : -3.5; GameAudio.sfx('stomp');
            } else if (p.inv <= 0) { die(); return; }
          }
        }

        // flag
        if (p.x + p.w > FLAG_X * T + 6) {
          if (coins >= COINS_NEEDED) {
            state = 'flag'; stateT = 0; p.x = FLAG_X * T - 4; p.vx = 0; p.vy = 0;
            GameAudio.stopMusic(); GameAudio.sfx('item');
          } else {
            p.x = FLAG_X * T + 6 - p.w; p.vx = 0;
            if (msgT <= 0) { say('TICKET COSTS ' + COINS_NEEDED + ' COINS! YOU HAVE ' + coins); GameAudio.sfx('wrong'); }
          }
        }

        // camera follows both ways, so missed coins behind can still be collected
        const target = Math.max(0, Math.min(p.x - lead(), MAP_W * T - Game.W));
        camX += (target - camX) * 0.2;
      },

      draw(ctx) {
        const t = Game.t;
        const cx = Math.round(camX);
        // 0 = deep in Bucharest (grey, smog, panel blocks), 1 = the green edge with the mountains in view
        const f = Math.max(0, Math.min(1, (cx - MAP_W * T * 0.42) / (MAP_W * T * 0.35)));
        this.bg = lerpColor('#9cb4c8', '#5c94fc', f); // side margins follow the sky (stretched blocks would streak)
        ctx.fillStyle = this.bg; ctx.fillRect(0, 0, Game.W, Game.H);

        // far away: the Carpathians rise as the city thins out
        if (f > 0) {
          ctx.save(); ctx.globalAlpha = f;
          for (let i = 0; i < 6; i++) {
            const mx = i * 220 - Math.round(cx * 0.25) - 60 + (i % 2) * 40;
            if (mx > -260 && mx < Game.W + 20) {
              ctx.fillStyle = i % 2 ? '#006800' : '#008838';
              ctx.beginPath(); ctx.moveTo(mx, 208); ctx.lineTo(mx + 110, 96 + (i % 3) * 14); ctx.lineTo(mx + 240, 208); ctx.fill();
              if (i % 2) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(mx + 96, 112 + (i % 3) * 14); ctx.lineTo(mx + 110, 96 + (i % 3) * 14); ctx.lineTo(mx + 124, 112 + (i % 3) * 14); ctx.fill(); }
            }
          }
          Sprites.tampa(ctx, 3 * 220 - Math.round(cx * 0.25) - 20, 118, 200, 90);
          for (let i = 0; i < 14; i++) {
            const hx = i * 150 - Math.round(cx * 0.5);
            if (hx > -100 && hx < Game.W + 10) Sprites.hill(ctx, hx, 170, 90, 38);
          }
          ctx.restore();
        }

        // Bucharest skyline: panel blocks, one giant palace, smog clouds; fades out toward the green part
        if (f < 1) {
          ctx.save(); ctx.globalAlpha = 1 - f;
          for (let i = 0; i < 20; i++) {
            const bx = i * 96 + 4 - Math.round(cx * 0.9);
            if (bx < -140 || bx > Game.W + 4) continue;
            if (i === 3) { S_parl(bx); continue; }
            const h = 60 + ((i * 37) % 5) * 12;
            Sprites.panelBlock(ctx, bx, 208 - h, 44, h, i + 3);
            Sprites.panelBlock(ctx, bx + 50, 208 - h + 20, 36, h - 20, i + 7);
          }
          for (let i = 0; i < 12; i++) {
            const sx = i * 170 + 40 - Math.round(cx * 0.5);
            if (sx > -60 && sx < Game.W + 4) {
              ctx.fillStyle = 'rgba(92,92,92,0.55)';
              ctx.fillRect(sx, 30 + (i % 3) * 16, 40, 10); ctx.fillRect(sx + 8, 24 + (i % 3) * 16, 24, 20);
            }
          }
          ctx.restore();
        }
        // white clouds in the clean part
        if (f > 0) {
          ctx.save(); ctx.globalAlpha = f;
          for (let i = 0; i < 12; i++) {
            const wx = i * 190 + 70 - Math.round(cx * 0.4);
            if (wx > -60 && wx < Game.W + 4) Sprites.cloud(ctx, wx, 26 + (i % 3) * 18);
          }
          ctx.restore();
        }
        // trees and bushes along the green stretch
        for (let tx = 70; tx < MAP_W; tx += 3) {
          const x = tx * T - cx;
          if (x < -40 || x > Game.W + 20) continue;
          if (tx % 2) Sprites.bush(ctx, x, 192); else drawFir(ctx, x + 8, 200, ((tx * 7) % 3) + 1);
        }
        // road sign: the mountains are that way
        {
          const sx = 80 * T - cx;
          if (sx > -80 && sx < Game.W + 10) {
            ctx.fillStyle = '#7c7c7c'; ctx.fillRect(sx + 30, 160, 3, 48);
            Game.box(sx, 142, 66, 22, '#006800', '#fff');
            Game.text(CONFIG.to, sx + 33, 145, '#fff', 1, 'center');
            Game.text('166 KM →', sx + 33, 154, '#fcd000', 1, 'center');
          }
        }

        // Gara de Nord at the end
        Sprites.station(ctx, (FLAG_X + 3) * T + 8 - cx, 144);

        Plat.drawTiles(ctx, map, camX, t);

        // flag pole
        const fx = FLAG_X * T + 7 - cx;
        ctx.fillStyle = '#80d010'; ctx.fillRect(fx, 40, 2, 152);
        ctx.fillStyle = '#006800'; ctx.beginPath(); ctx.arc(fx + 1, 38, 4, 0, 7); ctx.fill();
        const flagY = state === 'flag' ? Math.min(176, 44 + stateT * 2) : 44;
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(fx, flagY); ctx.lineTo(fx - 16, flagY + 8); ctx.lineTo(fx, flagY + 16); ctx.fill();
        Font.draw(ctx, 'D', fx - 8, flagY + 5, '#d82800');

        // checkpoint flag
        const kx = CHECKPOINT * T - cx;
        ctx.fillStyle = '#fff'; ctx.fillRect(kx, 176, 1, 32);
        ctx.fillStyle = gotCheckpoint ? '#fcd000' : '#7c7c7c'; ctx.fillRect(kx + 1, 176, 10, 7);

        // coins
        const spin = Math.abs(Math.sin(t * 5));
        for (const c of coinObjs) {
          if (c.taken) continue;
          const w = Math.max(2, 10 * spin);
          ctx.drawImage(Sprites.coin, Math.round(c.x + 5 - w / 2 - cx), c.y, w, 14);
        }
        for (const pp of pops) Sprites.draw(ctx, Sprites.coin, pp.x - cx, pp.y - pp.t * 1.5);

        // enemies
        for (const e of enemies) {
          if (!e.alive) continue;
          const img = e.flat ? Sprites.smogFlat : (Math.floor(e.anim) % 2 ? Sprites.smog1 : Sprites.smog2);
          ctx.drawImage(img, Math.round(e.x - 1 - cx), Math.round(e.y - 2), 16, 16);
        }

        Plat.drawPlayer(ctx, p, cx);

        // HUD
        const hudX = Game.W / 2 - 40; // centered
        Sprites.draw(ctx, Sprites.coin, hudX, 6);
        Game.text('X ' + String(coins).padStart(2, '0') + ' / ' + COINS_NEEDED, hudX + 14, 10, coins >= COINS_NEEDED ? '#fcd000' : '#fff', 1, 'left', '#000');
        Game.text(CONFIG.name, Game.W - 8, 10, '#fff', 1, 'right', '#000');
        if (msgT > 0) {
          const w = Font.width(msg) + 16;
          Game.box(Game.W / 2 - w / 2, 36, w, 20);
          Game.text(msg, Game.W / 2, 43, '#fcd000', 1, 'center');
        }
      },
    };
  };
})();
