// Level 4: Mario Kart-style race on DN1 from Bucharest to Brasov. Finish 1st.
// The first third is Bucharest: grey sky, smog, a traffic jam to weave through.
// Then the sky clears, trees and mountains show up and the road opens.
(function () {
  const ROAD_L = 56, ROAD_R = 200, LEN = 7000, PY = 176;
  const JAM_END = 2700;             // obstacles: city set before, mountain set after
  const CITY_END = 3000;            // rooftops on both sides until here, then scattered ones, then trees
  const HZ = 44;                    // horizon band at the top of the screen

  // obstacles along the track: [distance, x, type]
  function makeTrack() {
    const obs = [];
    let seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let d = 500; d < LEN - 300; d += 170 + rnd() * 120) {
      const r = rnd();
      let type;
      if (d < JAM_END) type = r < 0.2 ? 'boost' : r < 0.45 ? 'pothole' : r < 0.7 ? 'smog' : 'cone';
      else type = r < 0.2 ? 'boost' : r < 0.32 ? 'pothole' : r < 0.72 ? 'cone' : 'bear';
      obs.push({ d, x: ROAD_L + 14 + rnd() * (ROAD_R - ROAD_L - 28), type, hit: false, vx: rnd() < 0.5 ? 0.5 : -0.5 });
    }
    return obs;
  }

  // slow cars filling the road out of Bucharest
  const CAR_COLORS = [['#bcbcbc', '#7c7c7c'], ['#2038ec', '#0000a8'], ['#fcd000', '#c87c00'], ['#1c1c1c', '#3c3c3c'], ['#fcfcfc', '#bcbcbc'], ['#00a844', '#006800']];
  function makeJam() {
    const cars = [];
    let seed = 42;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const lanes = [80, 128, 176];
    // spacing grows with distance: bumper to bumper in Bucharest, almost nobody near Brasov
    for (let d = 240; d < LEN * 0.9; d += 55 + (d / LEN) * 520 + rnd() * 50) {
      const lane = lanes[Math.floor(rnd() * 3)];
      const c = CAR_COLORS[Math.floor(rnd() * CAR_COLORS.length)];
      cars.push({ d, x: lane + (rnd() - 0.5) * 16, speed: 0.75 + rnd() * 0.35 + (d / LEN) * 0.8, color: c[0], dark: c[1] });
    }
    return cars;
  }
  // how much traffic is around a track position: 1 = jam, 0 = empty road
  const density = d => Math.max(0, 1 - d / (LEN * 0.85));

  function drawKart(ctx, x, y, body, dark, spin) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (spin) ctx.rotate(spin);
    ctx.fillStyle = '#000';
    ctx.fillRect(-8, -9, 4, 6); ctx.fillRect(4, -9, 4, 6);
    ctx.fillRect(-8, 4, 4, 7); ctx.fillRect(4, 4, 4, 7);
    ctx.fillStyle = body; ctx.fillRect(-5, -11, 10, 22);
    ctx.fillStyle = dark; ctx.fillRect(-5, 7, 10, 4); ctx.fillRect(-6, -2, 12, 3);
    ctx.fillStyle = '#fcbcb0'; ctx.fillRect(-3, -3, 6, 5);
    ctx.fillStyle = body === '#d82800' ? '#d82800' : dark; ctx.fillRect(-3, -4, 6, 3);
    ctx.fillStyle = '#fff'; ctx.fillRect(-2, -12, 4, 2);
    ctx.restore();
  }

  // an ordinary car seen from above (traffic, parked cars)
  function drawCar(ctx, x, y, body, dark) {
    x = Math.round(x); y = Math.round(y);
    ctx.fillStyle = '#000'; ctx.fillRect(x - 8, y - 8, 3, 6); ctx.fillRect(x + 5, y - 8, 3, 6); ctx.fillRect(x - 8, y + 3, 3, 6); ctx.fillRect(x + 5, y + 3, 3, 6);
    ctx.fillStyle = body; ctx.fillRect(x - 6, y - 11, 12, 22);
    ctx.fillStyle = dark; ctx.fillRect(x - 6, y - 11, 12, 2); ctx.fillRect(x - 6, y + 9, 12, 2);
    ctx.fillStyle = '#58d8fc'; ctx.fillRect(x - 4, y - 8, 8, 4); ctx.fillRect(x - 4, y + 5, 8, 3);
    ctx.fillStyle = '#d82800'; ctx.fillRect(x - 5, y + 9, 2, 2); ctx.fillRect(x + 3, y + 9, 2, 2);
  }

  function drawBus(ctx, x, y) {
    x = Math.round(x); y = Math.round(y);
    ctx.fillStyle = '#000'; ctx.fillRect(x - 10, y - 18, 3, 8); ctx.fillRect(x + 7, y - 18, 3, 8); ctx.fillRect(x - 10, y + 10, 3, 8); ctx.fillRect(x + 7, y + 10, 3, 8);
    ctx.fillStyle = '#fcfcfc'; ctx.fillRect(x - 8, y - 22, 16, 44);
    ctx.fillStyle = '#2038ec'; ctx.fillRect(x - 8, y - 4, 16, 6);
    ctx.fillStyle = '#58d8fc'; ctx.fillRect(x - 6, y - 20, 12, 4);
    ctx.fillStyle = '#bcbcbc'; for (let k = 0; k < 4; k++) ctx.fillRect(x - 5, y + 5 + k * 4, 10, 1);
  }

  // rooftop of a panel block, top-down
  function drawRoof(ctx, x, y, w, h, seed) {
    ctx.fillStyle = '#8c8c8c'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#5c5c5c'; ctx.fillRect(x, y, w, 2); ctx.fillRect(x, y, 2, h);
    ctx.fillStyle = '#3c3c3c'; ctx.fillRect(x + w - 2, y, 2, h); ctx.fillRect(x, y + h - 2, w, 2);
    ctx.fillStyle = '#6c6c6c';
    for (let k = 0; k < 3; k++) ctx.fillRect(x + 5 + ((seed * 7 + k * 13) % (w - 12)), y + 6 + k * Math.floor((h - 12) / 3), 5, 5);
  }

  function drawFir(ctx, x, y) {
    ctx.fillStyle = '#006800';
    ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x - 8, y + 6); ctx.lineTo(x + 8, y + 6); ctx.fill();
    ctx.fillStyle = '#00a844';
    ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x - 5, y + 2); ctx.lineTo(x + 5, y + 2); ctx.fill();
    ctx.fillStyle = '#503000'; ctx.fillRect(x - 1, y + 6, 2, 3);
  }

  function lerpColor(a, b, t) {
    const pa = a.match(/\w\w/g).map(v => parseInt(v, 16)), pb = b.match(/\w\w/g).map(v => parseInt(v, 16));
    return 'rgb(' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',') + ')';
  }
  const clamp01 = v => Math.max(0, Math.min(1, v));

  // billboards on the left shoulder: [distance, line1, line2]
  const BOARDS = [
    [350, 'TRAFFIC', '10/10'],
    [1000, 'LEAVING', 'THE CITY'],
    [1700, 'STILL', 'LEAVING'],
    [2500, 'JAM ENDS', 'BREATHE'],
    [3300, 'PLOIESTI', 'GO ON'],
    [4300, 'SINAIA', 'AIR: OK'],
    [5300, 'PREDEAL', 'BEARS!'],
    [6300, CONFIG.to, 'JAM 0/10'],
  ];

  Game.levels[3] = function () {
    const failsAtStart = Game.fails;
    let obs, jam, p, rivals, state, stateT, countdown, finishPlace, cough, coughT, puffs;

    function reset() {
      obs = makeTrack();
      jam = makeJam();
      // rivals get a bit slower after every lost race
      const ease = Math.pow(0.93, Game.fails - failsAtStart);
      rivals = [
        { d: 120, x: 80, speed: 2.55 * ease, color: '#fcfcfc', dark: '#2038ec', wob: 0, bus: true },  // tourist bus
        { d: 80, x: 176, speed: 2.75 * ease, color: '#bcbcbc', dark: '#7c7c7c', wob: 1 },             // Dacia Logan
        { d: 40, x: 128, speed: 2.9 * ease, color: '#1c1c1c', dark: '#3c3c3c', wob: 2 },              // black BMW
      ];
      p = { x: 104, d: 0, v: 0, spin: 0, boost: 0, w: 12, h: 20 };
      state = 'count'; stateT = 0; countdown = 3; finishPlace = 0; coughT = 0; puffs = [];
    }
    reset();

    const place = () => 1 + rivals.filter(r => r.d > p.d).length;
    const ordinal = n => n + (['ST', 'ND', 'RD'][n - 1] || 'TH');
    // 0 = deep in Bucharest, 1 = mountains
    const clean = d => clamp01((d - 600) / (LEN * 0.72));

    return {
      isLevel: true,
      music: null,

      update() {
        stateT++;
        if (coughT > 0) coughT--;
        if (state === 'count') {
          if (stateT % 50 === 1 && countdown > 0) GameAudio.sfx('count');
          if (stateT % 50 === 0) {
            countdown--;
            if (countdown === 0) { state = 'race'; stateT = 0; GameAudio.sfx('go'); GameAudio.music('race'); }
          }
          return;
        }

        if (state === 'done') {
          p.d += p.v; p.v *= 0.97;
          for (const r of rivals) r.d += r.speed;
          if (stateT > 150) {
            if (finishPlace === 1) Game.clear('1ST PLACE!');
            else reset();
          }
          return;
        }

        // player control
        const I = Input.held;
        const max = p.boost > 0 ? 4.6 : 3.3;
        if (p.spin > 0) { p.spin--; p.v = Math.max(p.v - 0.15, 0.8); }
        else p.v = Math.min(p.v + (p.v < max ? 0.05 : -0.1), max);
        if (p.boost > 0) p.boost--;
        const steer = p.spin > 0 ? 0.6 : 2;
        if (I.left) p.x -= steer;
        if (I.right) p.x += steer;
        p.x = Math.max(ROAD_L + 6, Math.min(ROAD_R - 6, p.x));
        p.d += p.v;

        // obstacles
        for (const o of obs) {
          if (o.type === 'bear' && !o.hit) {
            // bears slowly cross the road
            o.x += o.vx;
            if (o.x < ROAD_L + 10 || o.x > ROAD_R - 10) o.vx = -o.vx;
          }
          if (o.type === 'smog') {
            o.x += o.vx * 0.6;
            if (o.x < ROAD_L + 10 || o.x > ROAD_R - 10) o.vx = -o.vx;
          }
          if (o.hit) continue;
          const oy = PY - (o.d - p.d);
          if (Math.abs(oy - PY) < 14 && Math.abs(o.x - p.x) < 12) {
            o.hit = true;
            if (o.type === 'boost') { p.boost = 70; GameAudio.sfx('boost'); }
            else if (o.type === 'smog') { p.v *= 0.55; coughT = 60; GameAudio.sfx('wrong'); }
            else if (p.spin <= 0) { p.spin = 45; GameAudio.sfx('crash'); }
          }
        }

        // traffic jam: slow cars, bumping into one holds you back
        for (const c of jam) {
          c.d += c.speed;
          const cy = PY - (c.d - p.d);
          if (Math.abs(cy - PY) < 22 && Math.abs(c.x - p.x) < 13) {
            p.x += p.x < c.x ? -2.5 : 2.5;
            if (cy < PY) p.v = Math.min(p.v, c.speed);
          }
        }

        // rivals drive their lane with a little wobble; the jam holds them too
        for (const r of rivals) {
          r.d += r.speed * (1 - 0.3 * density(r.d));
          r.x += Math.sin(Game.t * 1.3 + r.wob * 2) * 0.35;
          const ry = PY - (r.d - p.d);
          if (Math.abs(ry - PY) < (r.bus ? 30 : 20) && Math.abs(r.x - p.x) < (r.bus ? 15 : 13)) {
            p.x += p.x < r.x ? -3 : 3;
            if (ry < PY) p.v = Math.min(p.v, r.speed * 0.9);
          }
        }

        // exhaust puffs in the city part
        if (stateT % 6 === 0 && Math.random() < density(p.d)) puffs.push({ x: p.x + (Math.random() - 0.5) * 6, y: PY + 14, t: 0 });
        for (const q of puffs) { q.t++; q.y += 0.8; }
        puffs = puffs.filter(q => q.t < 30);

        if (p.d >= LEN) {
          finishPlace = 1 + rivals.filter(r => r.d >= LEN).length;
          state = 'done'; stateT = 0;
          GameAudio.stopMusic();
          if (finishPlace === 1) GameAudio.sfx('fanfare');
          else { GameAudio.sfx('wrong'); Game.fail(); }
        }
      },

      draw(ctx) {
        const W = Game.W, H = Game.H;
        const scroll = p.d % 32;
        const f = clean(p.d);
        // ground: dead city grass turns into mountain green (also fills the side margins on wide screens)
        this.bg = lerpColor('#8c8c74', '#00a844', f);
        ctx.fillStyle = this.bg; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = lerpColor('#7c7c64', '#009038', f);
        for (let y = -32; y < H; y += 32) { ctx.fillRect(0, y + scroll, ROAD_L, 16); ctx.fillRect(ROAD_R, y + scroll, W - ROAD_R, 16); }

        // roadside: rooftops and parked cars in the city, then scattered blocks, then forest
        for (let k = -1; k < 5; k++) {
          const dd = Math.floor((p.d + (3 - k) * 64) / 64) * 64;    // track distance of this row
          const y = PY - (dd - p.d);
          const s = Math.floor(dd / 64) + 12;   // +12 keeps it positive before the start line
          const cc = CAR_COLORS[s % 6], cc2 = CAR_COLORS[(s + 2) % 6];
          const city = dd < CITY_END || (dd < CITY_END * 1.8 && s % 3 === 0);
          if (city) {
            drawRoof(ctx, 2, y - 26, 40, 52, s);
            drawRoof(ctx, 214, y - 26, 40, 52, s + 5);
            // Bucharest parks on the sidewalk
            if (dd < CITY_END) { if (s % 2) drawCar(ctx, ROAD_L - 8, y + 2, cc[0], cc[1]); else drawCar(ctx, ROAD_R + 8, y - 6, cc2[0], cc2[1]); }
          } else {
            for (const tx of [16, 226]) {
              if ((s + (tx > 100 ? 1 : 0)) % 2) drawFir(ctx, tx, y);
              else {
                ctx.fillStyle = '#006800'; ctx.beginPath(); ctx.arc(tx, y, 11, 0, 7); ctx.fill();
                ctx.fillStyle = '#80d010'; ctx.beginPath(); ctx.arc(tx - 3, y - 3, 5, 0, 7); ctx.fill();
              }
            }
            if (s % 3 === 0) drawFir(ctx, 36, y + 20);
            if (s % 4 === 1) drawFir(ctx, 236, y + 24);
          }
        }
        // road
        ctx.fillStyle = lerpColor('#5c5c5c', '#6c6c6c', f); ctx.fillRect(ROAD_L, 0, ROAD_R - ROAD_L, H);
        for (let y = -32; y < H; y += 16) {
          const on = Math.floor((y - scroll + 320) / 16) % 2 === 0;
          ctx.fillStyle = on ? '#d82800' : '#fff';
          ctx.fillRect(ROAD_L - 6, y + scroll % 16, 6, 16); ctx.fillRect(ROAD_R, y + scroll % 16, 6, 16);
        }
        ctx.fillStyle = '#bcbcbc';
        for (let y = -32; y < H; y += 32) { ctx.fillRect(104, y + scroll, 2, 16); ctx.fillRect(152, y + scroll, 2, 16); }

        // km signs: BRASOV 90 KM ... 10 KM
        for (let k = 1; k <= 9; k++) {
          const y = PY - (k * LEN / 10 - p.d);
          if (y < -20 || y > H + 10) continue;
          ctx.fillStyle = '#7c7c7c'; ctx.fillRect(ROAD_R + 22, y, 2, 14);
          Game.box(ROAD_R + 4, y - 16, 40, 18, '#006800', '#fff');
          Game.text(CONFIG.to, ROAD_R + 24, y - 13, '#fff', 1, 'center');
          Game.text((100 - k * 10) + ' KM', ROAD_R + 24, y - 5, '#fcd000', 1, 'center');
        }
        // billboards on the left
        for (const [d, l1, l2] of BOARDS) {
          const y = PY - (d - p.d);
          if (y < -30 || y > H + 10) continue;
          ctx.fillStyle = '#503000'; ctx.fillRect(22, y, 2, 16); ctx.fillRect(30, y, 2, 16);
          Game.box(3, y - 20, 50, 22, d < JAM_END ? '#3c3c3c' : '#006800', '#fff');
          Game.text(l1, 28, y - 17, '#fff', 1, 'center');
          Game.text(l2, 28, y - 9, '#fcd000', 1, 'center');
        }

        // start + finish lines
        for (const [d, label] of [[0, CONFIG.from], [LEN, 'WELCOME TO ' + CONFIG.to]]) {
          const y = PY - (d - p.d) - 12;
          if (y > -20 && y < H + 20) {
            for (let k = 0; k < 18; k++) for (let j = 0; j < 2; j++) {
              ctx.fillStyle = (k + j) % 2 ? '#000' : '#fff';
              ctx.fillRect(ROAD_L + k * 8, y + j * 8, 8, 8);
            }
            Game.text(label, 128, y - 12, '#fff', 1, 'center', '#000');
          }
        }

        // obstacles
        for (const o of obs) {
          const y = PY - (o.d - p.d);
          if (y < -20 || y > H + 20 || (o.hit && o.type !== 'boost')) continue;
          if (o.type === 'pothole') {
            ctx.fillStyle = '#3c3c3c'; ctx.beginPath(); ctx.ellipse(o.x, y, 9, 6, 0, 0, 7); ctx.fill();
            ctx.fillStyle = '#1c1c1c'; ctx.beginPath(); ctx.ellipse(o.x + 1, y + 1, 6, 4, 0, 0, 7); ctx.fill();
          } else if (o.type === 'bear') {
            Sprites.draw(ctx, o.vx < 0 ? Sprites.bearL : Sprites.bear, o.x - 8, y - 8);
          } else if (o.type === 'smog') {
            const img = Game.blink(0.3) ? Sprites.smog1 : Sprites.smog2;
            ctx.drawImage(img, Math.round(o.x - 10), Math.round(y - 10), 20, 20);
          } else if (o.type === 'cone') {
            ctx.fillStyle = '#fc7400';
            ctx.beginPath(); ctx.moveTo(o.x, y - 9); ctx.lineTo(o.x - 7, y + 6); ctx.lineTo(o.x + 7, y + 6); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.fillRect(o.x - 4, y - 1, 8, 3);
          } else {
            ctx.fillStyle = Game.blink(0.15) ? '#fcd000' : '#fc7400';
            ctx.fillRect(o.x - 12, y - 8, 24, 16);
            Game.text('>>', o.x, y - 3, '#000', 1, 'center');
          }
        }

        // traffic jam
        for (const c of jam) {
          const y = PY - (c.d - p.d);
          if (y > -30 && y < H + 30) drawCar(ctx, c.x, y, c.color, c.dark);
        }
        // rivals
        for (const r of rivals) {
          const y = PY - (r.d - p.d);
          if (y > -30 && y < H + 30) { if (r.bus) drawBus(ctx, r.x, y); else drawKart(ctx, r.x, y, r.color, r.dark, 0); }
        }
        // exhaust
        for (const q of puffs) { ctx.fillStyle = 'rgba(120,120,120,' + (0.5 - q.t / 60) + ')'; ctx.fillRect(q.x - 2 - q.t / 6, q.y, 4 + q.t / 3, 4 + q.t / 3); }
        // player
        drawKart(ctx, p.x, PY, '#d82800', '#881400', p.spin > 0 ? p.spin * 0.4 : 0);
        if (p.boost > 0 && Game.blink(0.05)) { ctx.fillStyle = '#fcd000'; ctx.fillRect(p.x - 3, PY + 12, 6, 6); }
        if (coughT > 0) Game.text('COUGH!', p.x, PY - 26, '#fff', 1, 'center', '#000');

        // smog haze over everything while still in the city
        const haze = 0.42 * (1 - f);
        if (haze > 0.01) {
          ctx.fillStyle = 'rgba(110,104,96,' + haze.toFixed(2) + ')'; ctx.fillRect(0, 0, W, H);
          // grey smog clouds drifting over the road, same shape as the white clouds elsewhere
          for (let k = 0; k < 4; k++) {
            const sx = (k * 113 + Game.t * 8) % (W + 80) - 40, sy = HZ + 30 + k * 44 + Math.sin(Game.t + k) * 6;
            ctx.fillStyle = 'rgba(60,60,60,' + (haze * 0.5).toFixed(2) + ')';
            ctx.fillRect(sx + 8, sy + 5, 24, 12); ctx.fillRect(sx + 4, sy + 9, 32, 8); ctx.fillRect(sx + 14, sy + 1, 12, 6);
            ctx.fillStyle = 'rgba(140,140,140,' + (haze * 0.9).toFixed(2) + ')';
            ctx.fillRect(sx + 8, sy + 4, 24, 12); ctx.fillRect(sx + 4, sy + 8, 32, 8); ctx.fillRect(sx + 14, sy, 12, 6);
          }
        }

        // horizon: Bucharest skyline melts into the Carpathians
        ctx.fillStyle = lerpColor('#9cb4c8', '#5c94fc', f); ctx.fillRect(0, 0, W, HZ);
        if (f > 0) {
          ctx.save(); ctx.globalAlpha = f;
          for (let i = 0; i < 5; i++) {
            const mx = i * 70 - 20;
            ctx.fillStyle = i % 2 ? '#006800' : '#008838';
            ctx.beginPath(); ctx.moveTo(mx, HZ); ctx.lineTo(mx + 40, 8 + (i % 3) * 6); ctx.lineTo(mx + 84, HZ); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(mx + 35, 14 + (i % 3) * 6); ctx.lineTo(mx + 40, 8 + (i % 3) * 6); ctx.lineTo(mx + 45, 14 + (i % 3) * 6); ctx.fill();
          }
          ctx.fillStyle = '#00a844'; ctx.fillRect(0, HZ - 6, W, 6);
          ctx.restore();
        }
        if (f < 1) {
          ctx.save(); ctx.globalAlpha = 1 - f;
          for (let i = 0; i < 9; i++) {
            const h = 14 + ((i * 37) % 4) * 6;
            Sprites.panelBlock(ctx, i * 30 - 4, HZ - h, 24, h, i + 2);
          }
          ctx.fillStyle = 'rgba(92,92,92,0.6)';
          for (let i = 0; i < 4; i++) { const sx = (i * 73 + Game.t * 6) % (W + 40) - 20; ctx.fillRect(sx, 6 + (i % 2) * 8, 30, 7); }
          ctx.restore();
        }
        ctx.fillStyle = '#000'; ctx.fillRect(0, HZ, W, 1);

        // HUD
        const pl = state === 'done' ? finishPlace : place();
        Game.box(4, HZ + 4, 70, 22, '#000', '#fff');
        Game.text(ordinal(pl), 14, HZ + 9, pl === 1 ? '#fcd000' : '#fff', 2);
        Game.text('/4', 52, HZ + 15, '#7c7c7c');
        // air quality meter
        const airLabel = f < 0.3 ? 'SMOG' : f < 0.7 ? 'MEH' : 'FRESH';
        const airColor = f < 0.3 ? '#7c7c7c' : f < 0.7 ? '#fcd000' : '#80d010';
        Game.box(4, HZ + 28, 70, 24, '#000', '#fff');
        Game.text('AIR', 10, HZ + 33, '#fff');
        Game.text(airLabel, 36, HZ + 33, airColor);
        ctx.fillStyle = '#3c3c3c'; ctx.fillRect(10, HZ + 42, 58, 5);
        ctx.fillStyle = airColor; ctx.fillRect(10, HZ + 42, Math.round(6 + 52 * f), 5);
        // progress bar
        ctx.fillStyle = '#000'; ctx.fillRect(244, HZ + 8, 6, 160);
        ctx.fillStyle = '#fff'; ctx.fillRect(245, HZ + 9, 4, 158);
        for (const r of rivals) { ctx.fillStyle = r.color; ctx.fillRect(243, HZ + 164 - Math.min(1, r.d / LEN) * 156, 8, 3); }
        ctx.fillStyle = '#d82800'; ctx.fillRect(242, HZ + 163 - Math.min(1, p.d / LEN) * 156, 10, 5);
        Game.text('SPEED ' + Math.round(p.v * 30), 250, 216, '#fff', 1, 'right', '#000');

        if (state === 'count') {
          Game.text(String(countdown || ''), 128, 90, '#fcd000', 4, 'center', '#000');
          Game.text('LEFT / RIGHT TO STEER', 128, 124, '#fff', 1, 'center', '#000');
          Game.text('BUCHAREST: JAM, SMOG, GREY', 128, 136, '#fff', 1, 'center', '#000');
          Game.text(CONFIG.to + ': GREEN, FRESH AIR, BEARS', 128, 148, '#fff', 1, 'center', '#000');
          Game.text('HIT >> TO BOOST', 128, 160, '#fcd000', 1, 'center', '#000');
        } else if (state === 'race' && stateT < 50) {
          Game.text('GO!', 128, 90, '#00e8d8', 4, 'center', '#000');
        } else if (state === 'done') {
          Game.box(40, 80, 176, 56);
          Game.text(ordinal(finishPlace) + ' PLACE', 128, 92, finishPlace === 1 ? '#fcd000' : '#fff', 2, 'center');
          Game.text(finishPlace === 1 ? 'WELCOME TO ' + CONFIG.to + '!' : 'STUCK IN TRAFFIC! RETRY', 128, 116, '#fff', 1, 'center');
        }
      },
    };
  };
})();
