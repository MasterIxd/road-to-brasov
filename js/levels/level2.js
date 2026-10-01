// Level 2: Pokémon-style quiz battle at the train station vs WILD TRAIN DELAY.
(function () {
  const BOX_Y = 148;

  Game.levels[1] = function () {
    const Q = CONFIG.quiz;
    let qi = 0;
    let options = [];     // [{text, idx}]
    let cursor = 0;
    let state = 'intro';  // intro -> msg/ask loop -> faint
    let queue = [];       // messages waiting to be shown
    let after = null;     // callback when queue empties
    let typed = 0;        // typewriter progress
    // the delay IS the enemy's HP: right answers cut it, wrong ones add to it
    const MAX_DELAY = 120, CUT = MAX_DELAY / 3;
    let delay = MAX_DELAY, hpShown = 1;
    const hp = () => Math.min(1, delay / MAX_DELAY);
    let enemyIn = 0, flash = 0, shake = 0, faint = 0, heroIn = 0;

    function loadQuestion() {
      options = Q[qi].options.map((text, idx) => ({ text, idx }));
      cursor = 0;
      state = 'ask';
    }

    function say(lines, then) {
      queue = lines.slice();
      typed = 0;
      after = then;
      state = 'msg';
    }

    function answer(o) {
      GameAudio.sfx('confirm');
      const right = o.idx === Q[qi].answer;
      if (right) {
        say([CONFIG.name + ' USED ' + o.text + '!'], () => {
          flash = 40; shake = 20;
          GameAudio.sfx('hit');
          delay = Math.max(0, delay - CUT);
          say(["IT'S SUPER EFFECTIVE! -" + CUT + " MIN"], () => {
            qi++;
            if (qi >= Q.length) {
              faint = 1;
              GameAudio.stopMusic();
              GameAudio.sfx('stomp');
              const result = delay === 0
                ? ['THE TRAIN TO ' + CONFIG.to + ' DEPARTS ON TIME!', 'A CFR MIRACLE!']
                : ['THE TRAIN TO ' + CONFIG.to + ' DEPARTS ONLY ' + delay + ' MIN LATE.', 'A NEW CFR RECORD!'];
              say(['WILD TRAIN DELAY FAINTED!', ...result], () => Game.clear('ALL ABOARD!'));
            } else loadQuestion();
          });
        });
      } else {
        Game.fail();
        say([CONFIG.name + ' USED ' + o.text + '!'], () => {
          GameAudio.sfx('wrong');
          shake = 10;
          delay += 10;
          say(["IT'S NOT VERY EFFECTIVE...", "TRAIN DELAY USED 'WAIT'! +10 MIN"], () => {
            options = options.filter(x => x !== o);
            cursor = Math.min(cursor, options.length - 1);
            state = 'ask';
          });
        });
      }
    }

    // layout of option lines (used for drawing and tap detection)
    function layout() {
      const qLines = Font.wrap(Q[qi].q, 34);
      const top = BOX_Y + 10 + qLines.length * 10 + 4;
      return { qLines, top, step: qLines.length > 2 ? 10 : 12 }; // a three-line question leaves less room
    }

    say(['A WILD TRAIN DELAY APPEARED!', 'GO! ' + CONFIG.name + '!'], loadQuestion);

    return {
      isLevel: true,
      fourWay: true, // needs up/down on the touch pad
      bg: '#f8f8f0',
      music: 'battle',

      update() {
        if (enemyIn < 1) enemyIn = Math.min(1, enemyIn + 0.02);
        if (heroIn < 1) heroIn = Math.min(1, heroIn + 0.025);
        if (flash > 0) flash--;
        if (shake > 0) shake--;
        if (faint > 0 && faint < 60) faint++;
        hpShown += (hp() - hpShown) * 0.08;

        if (state === 'msg') {
          const cur = queue[0] || '';
          if (typed < cur.length) {
            typed += 1;
            if (Input.ok()) typed = cur.length;
          } else if (Input.ok() && flash === 0) {
            GameAudio.sfx('select');
            queue.shift();
            typed = 0;
            if (!queue.length) { const f = after; after = null; state = 'wait'; f && f(); }
          }
          return;
        }

        if (state === 'ask') {
          if (Input.pressed.up) { cursor = (cursor + options.length - 1) % options.length; GameAudio.sfx('select'); }
          if (Input.pressed.down) { cursor = (cursor + 1) % options.length; GameAudio.sfx('select'); }
          if (Input.pressed.tap) {
            const L = layout();
            const k = Math.floor((Input.tapY - L.top + 2) / L.step);
            if (Input.tapY >= BOX_Y && k >= 0 && k < options.length) { cursor = k; answer(options[k]); return; }
          }
          if (Input.pressed.a || Input.pressed.start) answer(options[cursor]);
        }
      },

      draw(ctx) {
        ctx.fillStyle = '#f8f8f0'; ctx.fillRect(0, 0, Game.W, Game.H);
        // floor stripes
        ctx.fillStyle = '#e8e8d8';
        for (let y = 0; y < BOX_Y; y += 8) ctx.fillRect(0, y, Game.W, 3);

        const sx = shake ? (Math.random() * 4 - 2) : 0;

        // wide screen: the battle stays centered, the two sides spread apart by k (but not under the touch buttons)
        const ox = Math.floor((Game.W - 256) / 2), k = Math.max(0, Math.min(ox - 90, 60));
        ctx.save(); ctx.translate(ox, 0);
        ctx.save(); ctx.translate(k, 0);

        // enemy platform + TRAIN DELAY
        ctx.fillStyle = '#b8d880';
        ctx.beginPath(); ctx.ellipse(192, 90, 58, 12, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#88b050';
        ctx.beginPath(); ctx.ellipse(192, 92, 50, 8, 0, 0, 7); ctx.fill();
        const ex = 136 + (1 - enemyIn) * (160 + ox) + sx;
        const ey = 6 + faint * 1.5;
        if (!(flash && Math.floor(flash / 4) % 2) && faint < 60) {
          ctx.save();
          ctx.beginPath(); ctx.rect(-ox - k, 0, Game.W, 92); ctx.clip();
          Sprites.draw(ctx, Sprites.train, ex, ey, 3);
          ctx.restore();
        }

        ctx.restore();
        ctx.save(); ctx.translate(-k, 0);
        // enemy HP box
        Game.box(8, 10, 122, 46, '#f8f8f0', '#383838');
        Game.text('TRAIN DELAY', 16, 16, '#000');
        Game.text('HP', 16, 28, '#d82800');
        ctx.fillStyle = '#383838'; ctx.fillRect(32, 28, 90, 7);
        ctx.fillStyle = hpShown > 0.5 ? '#00a844' : hpShown > 0.2 ? '#fcd000' : '#d82800';
        ctx.fillRect(33, 29, Math.max(0, 88 * hpShown), 5);
        Game.text(delay + ' MIN LATE', 122, 40, delay ? '#d82800' : '#00a844', 1, 'right');

        // player platform + hero (back view)
        ctx.fillStyle = '#b8d880';
        ctx.beginPath(); ctx.ellipse(62, 142, 50, 10, 0, 0, 7); ctx.fill();
        const hx = 42 - (1 - heroIn) * (120 + ox);
        Sprites.draw(ctx, Sprites.hero.back, hx, 96, 3);

        ctx.restore();
        ctx.save(); ctx.translate(k, 0);
        // player box
        Game.box(128, 100, 120, 38, '#f8f8f0', '#383838');
        Game.text(CONFIG.name, 136, 106, '#000');
        Game.text('LV:BDAY', 240, 106, '#000', 1, 'right');
        Game.text('HP', 136, 118, '#d82800');
        ctx.fillStyle = '#383838'; ctx.fillRect(152, 118, 88, 7);
        ctx.fillStyle = '#00a844'; ctx.fillRect(153, 119, 86, 5);
        Game.text('100/100', 240, 128, '#000', 1, 'right');

        ctx.restore();
        // text box
        Game.box(4, BOX_Y, 248, Game.H - BOX_Y - 4, '#fff', '#383838');
        ctx.fillStyle = '#383838'; ctx.fillRect(8, BOX_Y + 4, 240, 1);

        if (state === 'msg' && queue.length) {
          const cur = queue[0].slice(0, Math.floor(typed));
          Font.wrap(cur, 38).forEach((l, i) => Game.text(l, 14, BOX_Y + 14 + i * 12, '#000'));
          if (typed >= queue[0].length && Game.blink(0.3)) Game.text('>', 238, Game.H - 20, '#d82800');
        } else if (state === 'ask') {
          const L = layout();
          L.qLines.forEach((l, i) => Game.text(l, 14, BOX_Y + 10 + i * 10, '#000'));
          options.forEach((o, i) => {
            const y = L.top + i * L.step;
            if (i === cursor) { ctx.fillStyle = '#fcd000'; ctx.fillRect(10, y - 2, 236, 11); }
            Game.text((i === cursor ? '> ' : '  ') + o.text, 16, y, '#000');
          });
          Game.text('Q' + (qi + 1) + '/' + Q.length, 246, BOX_Y + 10, '#7c7c7c', 1, 'right');
        }
        ctx.restore();
      },
    };
  };
})();
