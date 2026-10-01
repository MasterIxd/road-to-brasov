// Level 5: BOSS BUCHAREST doesn't want Dima to leave. It hides in smog: bump a ? block to blow
// fresh mountain air at it, then jump on its stunned head. 3 times, then grab the cake.
(function () {
  const T = Plat.T;
  const ARENA = [
    'XXXXXXXXXXXXXXXX',
    'X..............X',
    'X..............X',
    'X..............X',
    'X..............X',
    'X..............X',
    'X..............X',
    'X..............X',
    'X..............X',
    'X??...B??B...??X',
    'X..............X',
    'X..............X',
    'X..............X',
    '################',
    '################',
  ];
  const BOSS_HP = 3;
  // what Bucharest says: at start, then after each hit (index = hp left)
  const QUOTES = { 3: "YOU CAN'T LEAVE ME!", 2: 'BUT... I HAVE TRAFFIC!', 1: 'AND SMOG! BREATHE IT IN!', 0: 'FINE. GO. TAKE THE MOUNTAINS.' };
  const STUN = 270; // frames the boss stays dizzy after a gust of fresh air
  // after each hit Bucharest adds an attack: hp 2 = cars race across the floor, hp 1 = smog clouds drift at you
  const GROUND_Y = 13 * 16;

  Game.levels[4] = function () {
    const map = Plat.parse(ARENA);
    let p, boss, state = 'intro', stateT = 0, parts = [], cake = null, quote = null, quoteT = 0, qx = 128;
    let cars = [], smogs = [], carT = 0, smogT = 0, wind = 0;
    // the ? blocks: fresh air inside. They go grey while the boss is dizzy and refill afterwards.
    const airBlocks = [];
    map.grid.forEach((row, ty) => row.forEach((c, tx) => { if (c === '?') airBlocks.push([tx, ty]); }));
    function setBlocks(c) { for (const [tx, ty] of airBlocks) map.grid[ty][tx] = c; }
    function say(text) { quote = text; quoteT = 150; qx = boss.x + 20; }
    function speak(hp) { say(QUOTES[hp]); }

    function resetPlayer() {
      p = Plat.createPlayer(2 * T, 12 * T - 15);
      p.inv = 90;
    }
    function resetBoss(hp) {
      boss = { x: 11 * T, y: 13 * T - 44, w: 40, h: 44, vx: 0, vy: 0, hp, inv: 0, stun: 0, jumpT: 150, onGround: true, face: -1 };
      cars = []; smogs = []; carT = 120; smogT = 90; wind = 0;
      setBlocks('?');
    }

    // fresh air out of a ? block: blows the smog off the boss and leaves it dizzy for a while
    function gust(tx, ty) {
      setBlocks('u');
      boss.stun = STUN; boss.vx = 0;
      smogs = [];
      wind = 70;
      say('COUGH! TOO FRESH!');
      GameAudio.sfx('boost');
      for (let k = 0; k < 24; k++) {
        const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 2.5;
        parts.push({ x: tx * T + 8, y: ty * T, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.5, c: ['#fff', '#a4e4fc', '#80d010'][k % 3], t: 60 });
      }
    }
    resetPlayer(); p.inv = 0;
    resetBoss(BOSS_HP);

    function die() {
      state = 'dead'; stateT = 0;
      p.dead = 1; p.vy = -5;
      GameAudio.stopMusic(); GameAudio.sfx('hurt');
      Game.fail();
    }

    function explode() {
      for (let k = 0; k < 60; k++) {
        const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 3;
        parts.push({ x: boss.x + 20, y: boss.y + 22, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, c: ['#fcd000', '#d82800', '#58d8fc', '#fc98b8', '#fff', '#8c3cd8'][k % 6], t: 0 });
      }
    }

    return {
      isLevel: true,
      bg: '#5c94fc',
      music: 'boss',

      update() {
        stateT++;
        for (const q of parts) { q.x += q.vx; q.y += q.vy; q.vy += 0.1; q.t++; }
        parts = parts.filter(q => q.t < 120);

        if (quoteT > 0) quoteT--;
        if (state === 'intro') { if (stateT > 150 || (stateT > 20 && Input.ok())) { state = 'fight'; stateT = 0; speak(BOSS_HP); } return; }

        if (state === 'dead') {
          p.vy += 0.3; p.y += p.vy;
          if (stateT > 90) { state = 'fight'; resetPlayer(); resetBoss(boss.hp); GameAudio.music('boss', true); }
          return;
        }

        if (state === 'won') {
          Plat.updatePlayer(map, p);
          if (cake) {
            cake.vy = Math.min(cake.vy + 0.2, 4);
            cake.y += cake.vy;
            if (cake.y > 13 * T - 16) { cake.y = 13 * T - 16; cake.vy = 0; }
            if (Plat.overlap(p, cake)) { cake = null; GameAudio.sfx('item'); Game.clear('BUCHAREST DEFEATED!'); }
          } else if (stateT === 80) {
            cake = { x: 120, y: -20, w: 16, h: 16, vy: 0 };
          }
          return;
        }

        // fight
        const res = Plat.updatePlayer(map, p);
        if (res.hitHead) {
          const [tx, ty] = res.hitHead;
          if (map.grid[ty][tx] === '?') gust(tx, ty); else GameAudio.sfx('bump');
        }
        if (wind > 0) wind--;

        // boss AI: walk toward the player, hop now and then; gets faster when hurt
        const hurtLevel = BOSS_HP - boss.hp;
        const speed = 0.45 + hurtLevel * 0.2;
        if (boss.inv > 0) boss.inv--;
        if (boss.stun > 0) { boss.stun--; boss.vx = 0; }
        else if (boss.onGround) {
          boss.face = p.x + 5 < boss.x + 20 ? -1 : 1;
          boss.vx = boss.face * speed;
          if (--boss.jumpT <= 0) { boss.vy = -5.5; boss.jumpT = 140 - hurtLevel * 25; GameAudio.sfx('bump'); }
        }
        boss.vy = Math.min(boss.vy + 0.25, 6);
        Plat.move(map, boss);
        if (boss.stun <= 0 && boss.inv <= 0 && map.grid[airBlocks[0][1]][airBlocks[0][0]] === 'u') setBlocks('?');

        // attack 1: traffic. A car shoots across the floor from the side the boss is on.
        if (boss.hp <= 2 && --carT <= 0) {
          const fromLeft = boss.x + 20 < 128;
          cars.push({ x: fromLeft ? -24 : 256, y: GROUND_Y - 12, w: 22, h: 12, vx: fromLeft ? 2.4 : -2.4, c: ['#fcd000', '#2038ec', '#fcfcfc', '#bcbcbc'][cars.length % 4] });
          carT = boss.hp === 1 ? 150 : 110;
          GameAudio.sfx('crash');
        }
        for (const c of cars) c.x += c.vx;
        cars = cars.filter(c => c.x > -40 && c.x < 300);
        // attack 2: smog. The boss coughs a cloud that drifts toward Dima.
        if (boss.hp <= 1 && boss.stun <= 0 && --smogT <= 0) {
          smogs.push({ x: boss.x + 12, y: boss.y + 8, w: 14, h: 14, vx: 0, vy: 0, t: 0 });
          smogT = 100;
          GameAudio.sfx('wrong');
        }
        for (const sm of smogs) {
          sm.t++;
          const dx = (p.x + 5) - (sm.x + 7), dy = (p.y + 7) - (sm.y + 7), len = Math.hypot(dx, dy) || 1;
          sm.vx = sm.vx * 0.96 + dx / len * 0.045; sm.vy = sm.vy * 0.96 + dy / len * 0.045;
          sm.x += sm.vx; sm.y += sm.vy + Math.sin(sm.t / 8) * 0.3;
        }
        smogs = smogs.filter(sm => sm.t < 420);
        if (p.inv <= 0) {
          for (const c of cars) if (Plat.overlap(p, c)) { die(); return; }
          for (const sm of smogs) if (Plat.overlap(p, { x: sm.x + 2, y: sm.y + 2, w: 10, h: 10 })) { die(); return; }
        }

        if (Plat.overlap(p, boss)) {
          const stomp = p.vy > 0 && p.y + p.h - boss.y < 12;
          if (stomp && boss.stun > 0 && boss.inv <= 0) {
            boss.hp--; boss.inv = 80; boss.stun = 0;
            speak(boss.hp);
            p.vy = -6.5; p.vx = (p.x < boss.x + 20 ? -2.5 : 2.5);
            GameAudio.sfx('hit');
            // push boss away from the player
            boss.x += p.x < boss.x + 20 ? 24 : -24;
            boss.x = Math.max(T, Math.min(15 * T - boss.w, boss.x));
            if (boss.hp <= 0) {
              state = 'won'; stateT = 0; explode(); cars = []; smogs = [];
              GameAudio.stopMusic(); GameAudio.sfx('fanfare');
            }
          } else if (stomp) {
            // bounced off: the boss is flashing or still wrapped in smog
            p.y = boss.y - p.h - 1; p.vy = -5;
            if (boss.inv <= 0) { p.inv = Math.max(p.inv, 20); GameAudio.sfx('bump'); say('MY SMOG PROTECTS ME!'); }
          } else if (p.inv <= 0 && boss.inv <= 40 && boss.stun <= 0) {
            die();
          }
        }
      },

      draw(ctx) {
        // the edge of Brasov: blue sky, Tampa with the BRASOV letters
        ctx.fillStyle = '#5c94fc'; ctx.fillRect(0, 0, Game.W, Game.H);
        Sprites.cloud(ctx, 40, 40); Sprites.cloud(ctx, 170, 56);
        Sprites.tampa(ctx, 28, 96, 210, 112);
        // traffic drives in from behind the arena walls
        for (const c of cars) {
          const x = Math.round(c.x), y = Math.round(c.y);
          ctx.fillStyle = c.c; ctx.fillRect(x, y + 3, 22, 7); ctx.fillRect(x + 5, y, 12, 4);
          ctx.fillStyle = '#58d8fc'; ctx.fillRect(x + (c.vx > 0 ? 12 : 6), y + 1, 4, 3);
          ctx.fillStyle = '#000'; ctx.fillRect(x + 3, y + 9, 5, 4); ctx.fillRect(x + 14, y + 9, 5, 4);
          ctx.fillStyle = '#fcd000'; ctx.fillRect(c.vx > 0 ? x + 20 : x, y + 5, 2, 2);
        }
        Plat.drawTiles(ctx, map, 0, Game.t);

        // boss
        if (state !== 'won') {
          const img = boss.inv > 0 && Math.floor(boss.inv / 4) % 2 ? Sprites.bossBuchHurt : Sprites.bossBuch;
          ctx.save();
          if (boss.face > 0) { ctx.translate(Math.round(boss.x) + 44, 0); ctx.scale(-1, 1); ctx.drawImage(img, 0, Math.round(boss.y - 4), 48, 48); }
          else ctx.drawImage(img, Math.round(boss.x - 4), Math.round(boss.y - 4), 48, 48);
          ctx.restore();
          if (boss.stun > 0) {
            // dizzy stars
            ctx.fillStyle = '#fcd000';
            for (let k = 0; k < 3; k++) ctx.fillRect(Math.round(boss.x + 19 + Math.cos(Game.t * 6 + k * 2.1) * 16), Math.round(boss.y - 9 + Math.sin(Game.t * 6 + k * 2.1) * 3), 3, 3);
          }
          // smog shield around its head; flickers back in shortly before the stun ends
          if (boss.inv <= 0 && (boss.stun <= 0 || (boss.stun < 60 && Math.floor(boss.stun / 5) % 2))) {
            for (let k = 0; k < 3; k++) {
              const img2 = (Math.floor(Game.t * 4) + k) % 2 ? Sprites.smog1 : Sprites.smog2;
              ctx.drawImage(img2, Math.round(boss.x - 6 + k * 18), Math.round(boss.y - 12 + Math.sin(Game.t * 3 + k * 2) * 2), 16, 16);
            }
          }
        }
        // gust of fresh air sweeping the arena
        if (wind > 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.75)';
          for (let k = 0; k < 8; k++) {
            const wx = ((70 - wind) * 7 + k * 61) % 288 - 32, wy = 44 + k * 19;
            if (wx > 16 && wx < 218) { ctx.fillRect(wx, wy, 22, 2); ctx.fillRect(wx + 16, wy - 2, 6, 2); }
          }
        }

        // smog clouds
        for (const sm of smogs) {
          const img = Math.floor(sm.t / 10) % 2 ? Sprites.smog1 : Sprites.smog2;
          ctx.drawImage(img, Math.round(sm.x), Math.round(sm.y), 16, 16);
        }
        for (const q of parts) { ctx.fillStyle = q.c; ctx.fillRect(q.x, q.y, 3, 3); }
        if (cake) Sprites.draw(ctx, Sprites.cake, cake.x, cake.y);

        Plat.drawPlayer(ctx, p, 0);

        // HUD
        Game.text(CONFIG.from, 20, 22, '#fff', 1, 'left', '#000');
        for (let k = 0; k < BOSS_HP; k++) Sprites.draw(ctx, k < boss.hp ? Sprites.heart : Sprites.heartEmpty, 82 + k * 10, 21);

        if (quoteT > 0 && quote) {
          const w = Font.width(quote) + 12;
          const bx = Math.max(18, Math.min(238 - w, qx - w / 2));
          const by = 48; // under the HUD, clear of the ? blocks
          Game.box(bx, by, w, 17, '#fff', '#000');
          Game.text(quote, bx + 6, by + 5, '#000');
        }
        Game.text(CONFIG.name, 236, 22, '#fff', 1, 'right', '#000');

        if (state === 'fight') {
          if (boss.stun > 0) { if (Game.blink(0.2)) Game.text('NOW! JUMP ON ITS HEAD!', 128, 36, '#fcd000', 1, 'center', '#000'); }
          else if (boss.inv <= 0) Game.text('HIT THE ? BLOCK!', 128, 36, '#fff', 1, 'center', '#000');
        }
        if (state === 'intro') {
          Game.box(28, 74, 200, 70);
          Game.text('BOSS: ' + CONFIG.from, 128, 84, '#d82800', 1, 'center');
          Game.text("DOESN'T WANT YOU TO LEAVE!", 128, 96, '#fff', 1, 'center');
          Game.text('HIT THE ? BLOCK FOR FRESH AIR', 128, 108, '#fcd000', 1, 'center');
          Game.text('THEN JUMP ON ITS HEAD 3 TIMES', 128, 120, '#fcd000', 1, 'center');
          Game.text('DODGE ITS TRAFFIC AND SMOG', 128, 132, '#7c7c7c', 1, 'center');
        }
        if (state === 'won' && stateT > 80 && cake) {
          Game.text('GRAB THE CAKE!', 128, 80, '#fcd000', 2, 'center', '#000');
        }
      },
    };
  };
})();
