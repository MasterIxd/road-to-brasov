// Final: welcome to Brasov, MOVE TO BRASOV? (NO runs away), chest, prize with QR + CLAIM.
(function () {
  function prizeLink() {
    try { return CONFIG.prizeLinkB64 ? atob(CONFIG.prizeLinkB64.trim()) : ''; } catch (e) { return ''; }
  }

  function renderQR(url) {
    const box = document.getElementById('qr');
    box.innerHTML = '';
    if (typeof qrcode !== 'function') return;
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    const n = qr.getModuleCount(), cell = 8, pad = 2;
    const c = document.createElement('canvas');
    c.width = c.height = (n + pad * 2) * cell;
    const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#000';
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) x.fillRect((k + pad) * cell, (r + pad) * cell, cell, cell);
    box.appendChild(c);
  }

  function showPrize() {
    const url = prizeLink();
    const el = document.getElementById('prize');
    const claim = document.getElementById('claim');
    const note = document.getElementById('prize-note');
    const qr = document.getElementById('qr');
    el.classList.remove('hidden');
    if (url) {
      renderQR(url);
      claim.href = url;
      claim.textContent = 'CLAIM ' + CONFIG.prizeAmount;
      claim.classList.remove('hidden');
      qr.classList.remove('hidden');
      note.textContent = 'Scan the code or tap the button';
    } else {
      claim.classList.add('hidden');
      qr.classList.add('hidden');
      note.textContent = 'Prize link is not set yet. Ask ' + CONFIG.friend + '!';
    }
  }

  const YES = { x: 52, y: 150, w: 60, h: 26 };

  Game.finalScene = function () {
    let phase = 'congrats', t = 0, open = 0;
    let sel = 0, no = { x: 144, y: 150, w: 60, h: 26 }, noTries = 0, answered = false;
    let hoverX = -1, hoverY = -1;
    const NO_LIMIT = 3;

    // mouse hover (desktop): NO runs away from the cursor
    const canvas = Game.canvas;
    const onMove = e => {
      const r = canvas.getBoundingClientRect();
      hoverX = (e.clientX - r.left) / r.width * 256;
      hoverY = (e.clientY - r.top) / r.height * 240;
    };
    canvas.addEventListener('mousemove', onMove);

    const inside = (b, x, y, pad = 0) => x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + b.h + pad;

    function runAway(fromX, fromY) {
      noTries++;
      GameAudio.sfx('jump');
      sel = 0;
      if (noTries >= NO_LIMIT) return;
      // pick a spot far from the pointer and away from YES
      let best = null, bestD = -1;
      for (let k = 0; k < 12; k++) {
        const c = { x: 10 + Math.random() * 176, y: 100 + Math.random() * 110, w: 60, h: 26 };
        if (inside(YES, c.x + 30, c.y + 13, 40)) continue;
        const d = Math.hypot(c.x + 30 - fromX, c.y + 13 - fromY);
        if (d > bestD) { bestD = d; best = c; }
      }
      if (best) no = best;
    }
    const confetti = [];
    const stars = Array.from({ length: 40 }, () => [Math.random() * 256, Math.random() * 240, Math.random()]);
    const colors = ['#fcd000', '#d82800', '#58d8fc', '#fc98b8', '#80d010', '#fff', '#8c3cd8'];

    function addConfetti(n, y0) {
      for (let k = 0; k < n; k++) confetti.push({
        x: Math.random() * 256, y: y0 === undefined ? -Math.random() * 60 : y0,
        vx: Math.random() - 0.5, vy: 0.6 + Math.random() * 1.2, c: colors[k % colors.length], w: 2 + (k % 3),
      });
    }
    addConfetti(80);

    return {
      bg: '#0c0c3c', // solid side margins (stretched stars would streak)
      music: 'birthday',

      update() {
        t++;
        for (const c of confetti) { c.x += c.vx + Math.sin((t + c.y) * 0.05) * 0.3; c.y += c.vy; }
        for (let i = confetti.length - 1; i >= 0; i--) if (confetti[i].y > 250) confetti.splice(i, 1);
        if (confetti.length < 70 && t % 3 === 0) addConfetti(2);

        if (phase === 'congrats' && t > 120 && Input.ok()) { phase = 'move'; t = 0; GameAudio.sfx('confirm'); }
        else if (phase === 'move' && !answered) {
          const noGone = noTries >= NO_LIMIT;
          // hover / keyboard / tap on NO: it runs away
          if (!noGone && hoverX >= 0 && inside(no, hoverX, hoverY, 10)) runAway(hoverX, hoverY);
          if (!noGone && (Input.pressed.right || Input.pressed.left || Input.pressed.down || Input.pressed.up)) runAway(YES.x + 30, YES.y + 13);
          if (Input.pressed.tap) {
            if (inside(YES, Input.tapX, Input.tapY, 4)) { answered = true; }
            else if (!noGone && inside(no, Input.tapX, Input.tapY, 14)) runAway(Input.tapX, Input.tapY);
          }
          if ((Input.pressed.a || Input.pressed.start) && sel === 0) answered = true;
          if (answered) { t = 0; GameAudio.sfx('item'); addConfetti(40, 100); }
        }
        else if (phase === 'move' && answered && t > 110) { phase = 'chest'; t = 0; }
        else if (phase === 'chest' && t > 20 && Input.ok() && !open) { open = 1; GameAudio.stopMusic(); GameAudio.sfx('secret'); }
        if (open) {
          open++;
          if (open === 40) { GameAudio.sfx('fanfare'); addConfetti(60, 120); }
          if (open === 150) { phase = 'prize'; t = 0; showPrize(); GameAudio.music('birthday', true); }
        }
      },

      draw(ctx) {
        const W = Game.W;
        ctx.fillStyle = '#0c0c3c'; ctx.fillRect(0, 0, W, Game.H);
        for (const [x, y, b] of stars) { ctx.fillStyle = Math.sin(Game.t * 3 + b * 10) > 0 ? '#fff' : '#7c7c7c'; ctx.fillRect(x, y, 1, 1); }

        if (phase === 'congrats') {
          Game.text('WELCOME TO', W / 2, 20, '#fff', 1, 'center');
          Game.text(CONFIG.to + '!', W / 2, 34, '#80d010', 3, 'center', '#006800');
          if (t > 30) Game.text('YOU MADE IT, ' + CONFIG.name + '!', W / 2, 74, '#fff', 1, 'center');
          if (t > 60) {
            Game.text('HAPPY', W / 2, 98, '#fc98b8', 2, 'center', '#000');
            Game.text('BIRTHDAY!', W / 2, 118, '#fc98b8', 2, 'center', '#000');
          }
          const bob = Math.abs(Math.sin(Game.t * 4)) * 6;
          Sprites.draw(ctx, Sprites.hero.jump, 104, 150 - bob, 2);
          Sprites.draw(ctx, Sprites.cake, 136, 168, 2);
          if (t > 120 && Game.blink(0.4)) Game.text('PRESS A', W / 2, 218, '#fff', 1, 'center');
        }

        if (phase === 'move') {
          if (!answered) {
            Game.text('SO, ' + CONFIG.name + '...', W / 2, 34, '#fff', 1, 'center');
            Game.text('MOVE TO', W / 2, 54, '#fff', 2, 'center');
            Game.text(CONFIG.to + '?', W / 2, 74, '#fcd000', 3, 'center', '#881400');
            // YES
            Game.box(YES.x, YES.y, YES.w, YES.h, sel === 0 ? '#00a844' : '#006800', '#fff');
            Game.text('YES', YES.x + YES.w / 2, YES.y + 7, '#fff', 2, 'center');
            // NO (runs away)
            if (noTries < NO_LIMIT) {
              Game.box(no.x, no.y, no.w, no.h, '#881400', '#fff');
              Game.text('NO', no.x + no.w / 2, no.y + 7, '#fff', 2, 'center');
            } else {
              Game.text('NO IS NOT AVAILABLE', W / 2, 196, '#7c7c7c', 1, 'center');
              Game.text('IN YOUR REGION', W / 2, 208, '#7c7c7c', 1, 'center');
            }
          } else {
            Game.text('GREAT CHOICE!', W / 2, 70, '#80d010', 2, 'center', '#006800');
            Game.text('WELCOME HOME, NEIGHBOR.', W / 2, 104, '#fff', 1, 'center');
            Game.text('AND NOW, YOUR BIRTHDAY GIFT...', W / 2, 150, '#fcd000', 1, 'center');
          }
        }

        if (phase === 'chest') {
          Game.text('A SECRET CHEST APPEARED!', W / 2, 40, '#fff', 1, 'center');
          const cx = 96, cy = 110;
          // chest
          ctx.fillStyle = '#6c3c00'; ctx.fillRect(cx, cy + 16, 64, 36);
          ctx.fillStyle = '#a86800'; ctx.fillRect(cx + 4, cy + 20, 56, 28);
          ctx.fillStyle = '#fcd000'; ctx.fillRect(cx, cy + 30, 64, 4); ctx.fillRect(cx + 28, cy + 26, 8, 12);
          const lift = open ? Math.min(20, open) : 0;
          ctx.fillStyle = '#6c3c00'; ctx.fillRect(cx - 2, cy - lift, 68, 18);
          ctx.fillStyle = '#a86800'; ctx.fillRect(cx + 2, cy + 3 - lift, 60, 12);
          ctx.fillStyle = '#fcd000'; ctx.fillRect(cx - 2, cy + 14 - lift, 68, 3);
          if (open) {
            // light beams + rising prize
            ctx.fillStyle = 'rgba(252,208,0,0.25)';
            ctx.beginPath(); ctx.moveTo(cx + 8, cy + 16); ctx.lineTo(cx - 30, 0); ctx.lineTo(cx + 94, 0); ctx.lineTo(cx + 56, cy + 16); ctx.fill();
            const rise = Math.min(70, open * 1.2);
            if (open > 20) Game.text(CONFIG.prizeAmount, W / 2, cy + 6 - rise, '#fcd000', 4, 'center', '#881400');
          } else if (t > 20 && Game.blink(0.4)) {
            Game.text('PRESS A TO OPEN', W / 2, 190, '#fcd000', 1, 'center');
          }
        }

        if (phase === 'prize') {
          Game.text('REWARD UNLOCKED!', W / 2, 10, '#fff', 1, 'center');
          const s = 5 + Math.sin(Game.t * 4) * 0.3;
          Game.text(CONFIG.prizeAmount, W / 2, 28, '#fcd000', Math.round(s), 'center', '#881400');
          Game.text('HAPPY BIRTHDAY, ' + CONFIG.name + '!', W / 2, 78, '#fc98b8', 1, 'center');
          Game.text('FROM YOUR FUTURE NEIGHBOR, ' + CONFIG.friend, W / 2, 90, '#bcbcbc', 1, 'center');
        }

        for (const c of confetti) { ctx.fillStyle = c.c; ctx.fillRect(c.x, c.y, c.w, c.w); }
      },
    };
  };
})();
