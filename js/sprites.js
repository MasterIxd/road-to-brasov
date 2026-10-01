// Original NES-style pixel sprites, built from text maps at startup.
(function () {
  const PAL = {
    'R': '#d82800', 'r': '#881400', 'S': '#fcbcb0', 'H': '#503000', 'G': '#00a844',
    'g': '#006800', 'B': '#2038ec', 'b': '#0000a8', 'K': '#000000', 'W': '#ffffff',
    'P': '#8c3cd8', 'p': '#5c1ca0', 'Y': '#fcd000', 'y': '#c87c00', 'O': '#fc7400',
    'N': '#a86800', 'n': '#6c3c00', 'L': '#bcbcbc', 'l': '#7c7c7c', 'C': '#fc98b8',
    'c': '#e45c80', 'T': '#58d8fc', 'M': '#fcfcfc', 'E': '#00e8d8',
  };

  function make(rows, palette = {}) {
    const w = Math.max(...rows.map(r => r.length));
    const h = rows.length;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const ch = rows[j][i];
        if (!ch || ch === '.') continue;
        x.fillStyle = palette[ch] || PAL[ch] || '#f0f';
        x.fillRect(i, j, 1, 1);
      }
    return c;
  }

  // flipped copy (for facing left)
  function flip(src) {
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const x = c.getContext('2d');
    x.translate(src.width, 0); x.scale(-1, 1);
    x.drawImage(src, 0, 0);
    return c;
  }

  // ---------- hero (Dima): red cap, green shirt, blue jeans ----------
  const heroTop = [
    '...RRRRR....',
    '..RRRRRRRRR.',
    '..HHHSSKS...',
    '.HSHSSSKSSS.',
    '.HSHHSSSSSSS',
    '.HHSSSSSKKK.',
    '...SSSSSSS..',
  ];
  const heroStand = heroTop.concat([
    '..GGGGGGG...',
    '.GGGGGGGGG..',
    'SSGGGGGGGSS.',
    'SSGGGGGGGSS.',
    '..BBBBBBB...',
    '..BBB.BBB...',
    '..BB...BB...',
    '.KKK...KKK..',
    'KKKK...KKKK.',
  ]);
  const heroWalk1 = heroTop.concat([
    '..GGGGGGG...',
    '.GGGGGGGGG..',
    'SSGGGGGGGSS.',
    'SSGGGGGGGSS.',
    '..BBBBBBB...',
    '.BBB...BBB..',
    'BBB.....BB..',
    'KK......KKK.',
    'K........KK.',
  ]);
  const heroWalk2 = heroTop.concat([
    '..GGGGGGG...',
    '.GGGGGGGGG..',
    '.GSGGGGGGS..',
    '.GSGGGGGGS..',
    '..BBBBBBB...',
    '...BBBBB....',
    '...BBBB.....',
    '...KKKK.....',
    '...KKKKK....',
  ]);
  const heroJump = heroTop.concat([
    'S.GGGGGGG.S.',
    'SGGGGGGGGGS.',
    '.GGGGGGGGG..',
    '.GGGGGGGGG..',
    '..BBBBBBB...',
    '.BBB...BBB..',
    '.BB.....BB..',
    'KKK.....KKK.',
    '............',
  ]);
  // top-down back view (walking up)
  const heroBack = [
    '...RRRRR....',
    '..RRRRRRRR..',
    '..RRRRRRRR..',
    '..HHHHHHHH..',
    '..HHHHHHHH..',
    '...HHHHHH...',
    '....SSSS....',
    '..GGGGGGGG..',
    '.SGGGGGGGGS.',
    '.SGGGGGGGGS.',
    '..GGGGGGGG..',
    '..BBBBBBBB..',
    '..BBB..BBB..',
    '..BBB..BBB..',
    '..KKK..KKK..',
    '............',
  ];
  // top-down front view (walking down)
  const heroFront = [
    '...RRRRR....',
    '..RRRRRRRR..',
    '..RRRRRRRR..',
    '..HSSSSSSH..',
    '..SKSSSSKS..',
    '..SSSSSSSS..',
    '...SSKKSS...',
    '..GGGGGGGG..',
    '.SGGGGGGGGS.',
    '.SGGGGGGGGS.',
    '..GGGGGGGG..',
    '..BBBBBBBB..',
    '..BBB..BBB..',
    '..BBB..BBB..',
    '..KKK..KKK..',
    '............',
  ];

  // ---------- "Grumble" enemy: grumpy purple blob ----------
  const blobTop = [
    '................',
    '.....PPPPPP.....',
    '...PPPPPPPPPP...',
    '..PPKPPPPPPKPP..',
    '.PPPPKPPPPKPPPP.',
    '.PPWWKPPPPKWWPP.',
    'PPPWKKPPPPKKWPPP',
    'PPPWKKPPPPKKWPPP',
    'PPPPPPPPPPPPPPPP',
    'PPPPKKKKKKKKPPPP',
    'PPPPPKPPPPKPPPPP',
    '.PPPPPPPPPPPPPP.',
    '..pppppppppppp..',
  ];
  const blob1 = blobTop.concat(['...KKK....KKK...', '..KKKK....KKKK..', '................']);
  const blob2 = blobTop.concat(['....KKK..KKK....', '....KKKK.KKKK...', '................']);
  const blobFlat = [
    '................', '................', '................', '................',
    '................', '................', '................', '................',
    '................', '................', '.PPPPPPPPPPPPPP.', 'PPPWKKPPPPKKWPPP',
    'PPPPPKKKKKKPPPPP', '.pppppppppppppp.', '..KKKK....KKKK..', '................',
  ];

  const coin = [
    '...YYYY...',
    '..YYYYYY..',
    '.YYWYYYyY.',
    '.YWYYYYyY.',
    'YYWYYYYyYY',
    'YYWYYYYyYY',
    'YYWYYYYyYY',
    'YYWYYYYyYY',
    'YYWYYYYyYY',
    'YYWYYYYyYY',
    '.YWYYYYyY.',
    '.YYYYYyyY.',
    '..YYYYYY..',
    '...YYYY...',
  ];

  const key = [
    '..YYYY..........',
    '.YyyyyY.........',
    'YyY..YyY........',
    'Yy....yYYYYYYYYY',
    'Yy....yyyyyyyyyy',
    'YyY..YyY...Yy.Yy',
    '.YyyyyY....Yy.Yy',
    '..YYYY.....yy.yy',
  ];

  const heart = [
    '.RR.RR.',
    'RWRRRRR',
    'RRRRRRR',
    'RRRRRRR',
    '.RRRRR.',
    '..RRR..',
    '...R...',
  ];

  const cake = [
    '.......Y........',
    '.......O........',
    '.......W........',
    '...W...W...W....',
    '..CCCCCCCCCCCC..',
    '.CWWCWWCCWWCWWC.',
    '.CCWCCWCCWCCWCC.',
    '.NNNNNNNNNNNNNN.',
    '.nnnnnnnnnnnnnn.',
    '.CCCCCCCCCCCCCC.',
    '.cCcCcCcCcCcCcC.',
    '.NNNNNNNNNNNNNN.',
    '.nnnnnnnnnnnnnn.',
    'LLLLLLLLLLLLLLLL',
    '.llllllllllllll.',
  ];

  // big cake monster for the quiz battle
  const cakemon = [
    '..........Y...........',
    '.........YOY..........',
    '..........O...........',
    '..........W...........',
    '..........W...........',
    '...CCCCCCCCCCCCCCCC...',
    '..CWWWCCWWWCCWWWCCWC..',
    '..CCWCCCCWCCCCWCCCWC..',
    '..NNNNNNNNNNNNNNNNNN..',
    '..NNWWWNNNNNNNNWWWNN..',
    '..NWKKWNNNNNNNNWKKWN..',
    '..NWKKWNNNNNNNNWKKWN..',
    '..NNWWNNNNNNNNNNWWNN..',
    '..CCCCCCCCCCCCCCCCCC..',
    '..CCCCKKKKKKKKKKCCCC..',
    '..CCCCKWKWKWKWKKCCCC..',
    '..CCCCCKKKKKKKKCCCCC..',
    '..NNNNNNNNNNNNNNNNNN..',
    '..nnnnnnnnnnnnnnnnnn..',
    'LLLLLLLLLLLLLLLLLLLLLL',
    '.llllllllllllllllllll.',
  ];

  // final boss: huge grumble with a party hat
  const boss = [
    '...........Y............',
    '..........YTY...........',
    '..........TCT...........',
    '.........TCTCT..........',
    '........CTCTCTC.........',
    '.......TCTCTCTCT........',
    '......PPPPPPPPPPPP......',
    '....PPPPPPPPPPPPPPPP....',
    '...PPKKPPPPPPPPPPKKPP...',
    '..PPPPKKPPPPPPPPKKPPPP..',
    '.PPPWWWKKPPPPPPKKWWWPPP.',
    '.PPWWWKKKPPPPPPKKKWWWPP.',
    'PPPWWKKKKPPPPPPKKKKWWPPP',
    'PPPWWKKKKPPPPPPKKKKWWPPP',
    'PPPPWWWWPPPPPPPPWWWWPPPP',
    'PPPPPPPPPPPPPPPPPPPPPPPP',
    'PPPPKKKKKKKKKKKKKKKKPPPP',
    'PPPPKWWKWWKWWKWWKWWKPPPP',
    'PPPPKKKKKKKKKKKKKKKKPPPP',
    '.PPPPPPPPPPPPPPPPPPPPPP.',
    '..pppppppppppppppppppp..',
    '..KKKKKK........KKKKKK..',
    '.KKKKKKK........KKKKKKK.',
    '........................',
  ];

  const slime = [
    '................',
    '................',
    '................',
    '......EEEE......',
    '....EEEEEEEE....',
    '...EEWEEEEEEE...',
    '..EEWEEEEEEEEE..',
    '..EEEKEEEEKEEE..',
    '.EEEEKEEEEKEEEE.',
    '.EEEEEEEEEEEEEE.',
    '.EEEEEEKKEEEEEE.',
    'EEEEEEEEEEEEEEEE',
    'EEEEEEEEEEEEEEEE',
    '.gggggggggggggg.',
    '................',
    '................',
  ];

  const banana = [
    '......Nn',
    '.....YY.',
    '....YYY.',
    '..YYYYy.',
    'YYYYYy..',
    '.YYyy...',
  ];

  const S = {
    PAL, make, flip,
    hero: {
      stand: make(heroStand), walk1: make(heroWalk1), walk2: make(heroWalk2), jump: make(heroJump),
      back: make(heroBack), front: make(heroFront),
    },
    blob1: make(blob1), blob2: make(blob2), blobFlat: make(blobFlat),
    coin: make(coin), key: make(key), heart: make(heart), heartEmpty: make(heart, { R: '#3c3c3c', W: '#555' }),
    cake: make(cake), cakemon: make(cakemon), boss: make(boss),
    bossHurt: make(boss, { P: '#fcfcfc', p: '#bcbcbc' }),
    slime: make(slime), banana: make(banana),
  };
  S.heroL = {};
  for (const k in S.hero) S.heroL[k] = flip(S.hero[k]);

  // draw helper with optional horizontal flip and integer scale
  S.draw = function (ctx, img, x, y, scale = 1) {
    ctx.drawImage(img, Math.round(x), Math.round(y), img.width * scale, img.height * scale);
  };

  // ---------- procedural tiles ----------
  S.tile = {
    ground(ctx, x, y) {
      ctx.fillStyle = '#c84c0c'; ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#fcbcb0'; ctx.fillRect(x, y, 16, 1); ctx.fillRect(x, y, 1, 16);
      ctx.fillStyle = '#000';
      ctx.fillRect(x, y + 15, 16, 1); ctx.fillRect(x + 15, y, 1, 16);
      ctx.fillRect(x + 7, y + 4, 1, 7); ctx.fillRect(x + 8, y + 10, 6, 1);
    },
    brick(ctx, x, y) {
      ctx.fillStyle = '#c84c0c'; ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#000';
      for (let r = 0; r < 4; r++) ctx.fillRect(x, y + r * 4 + 3, 16, 1);
      for (let r = 0; r < 4; r++) {
        const off = r % 2 ? 4 : 12;
        ctx.fillRect(x + off, y + r * 4, 1, 3);
      }
      ctx.fillStyle = '#fcbcb0'; ctx.fillRect(x, y, 16, 1);
    },
    question(ctx, x, y, t) {
      const glow = [ '#fc9838', '#fcbc58', '#fc9838', '#c84c0c' ][Math.floor(t * 4) % 4];
      ctx.fillStyle = glow; ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#000';
      ctx.fillRect(x, y + 15, 16, 1); ctx.fillRect(x + 15, y, 1, 16);
      ctx.fillStyle = '#c84c0c';
      ctx.fillRect(x + 1, y + 1, 1, 1); ctx.fillRect(x + 14, y + 1, 1, 1);
      ctx.fillRect(x + 1, y + 14, 1, 1); ctx.fillRect(x + 14, y + 14, 1, 1);
      Font.draw(ctx, '?', x + 5, y + 4, '#fff', 1, 'left', '#c84c0c');
    },
    used(ctx, x, y) {
      ctx.fillStyle = '#a0522d'; ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#000'; ctx.strokeStyle = '#000';
      ctx.fillRect(x, y + 15, 16, 1); ctx.fillRect(x + 15, y, 1, 16);
      ctx.fillRect(x, y, 16, 1); ctx.fillRect(x, y, 1, 16);
    },
    stone(ctx, x, y) {
      ctx.fillStyle = '#7c7c7c'; ctx.fillRect(x, y, 16, 16);
      ctx.fillStyle = '#bcbcbc'; ctx.fillRect(x, y, 15, 1); ctx.fillRect(x, y, 1, 15);
      ctx.fillStyle = '#3c3c3c'; ctx.fillRect(x, y + 15, 16, 1); ctx.fillRect(x + 15, y, 1, 16);
    },
  };

  S.cloud = function (ctx, x, y) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 8, y + 4, 24, 12);
    ctx.fillRect(x + 4, y + 8, 32, 8);
    ctx.fillRect(x + 14, y, 12, 6);
    ctx.fillStyle = '#58d8fc';
    ctx.fillRect(x + 10, y + 14, 20, 2);
  };

  S.bush = function (ctx, x, y) {
    ctx.fillStyle = '#80d010';
    ctx.fillRect(x + 4, y + 6, 32, 10);
    ctx.fillRect(x + 10, y + 1, 20, 8);
    ctx.fillStyle = '#006800';
    ctx.fillRect(x + 14, y + 5, 2, 2); ctx.fillRect(x + 24, y + 5, 2, 2);
  };

  S.hill = function (ctx, x, y, w, h) {
    ctx.fillStyle = '#00a844';
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w / 2 - 8, y + 4);
    ctx.lineTo(x + w / 2 + 8, y + 4);
    ctx.lineTo(x + w, y + h);
    ctx.fill();
    ctx.fillStyle = '#006800';
    ctx.fillRect(x + w / 2 - 6, y + 14, 2, 4); ctx.fillRect(x + w / 2 + 4, y + 14, 2, 4);
  };


  // ================= v2: Bucharest → Brasov =================
  // TRAIN DELAY: a grumpy locomotive seen from the front (pantograph, LED board, windshield eyes, grille)
  const train = [
    '..........KKKKKKKKKKKK..........',
    '............K......K............',
    '.............K....K.............',
    '......KKKKKKKKKKKKKKKKKKKK......',
    '.....KlLLLLLLLLLLLLLLLLLLlK.....',
    '....KBBBBBBBBBBWYBBBBBBBBBBK....',
    '...KBBKKKKKKKKKKKKKKKKKKKKBBK...',
    '...KBBKOOKOKOOOKOOKOKOOOKKBBK...',
    '...KBBKKKKKKKKKKKKKKKKKKKKBBK...',
    '...KbBBBBBBBBBBBBBBBBBBBBBBbK...',
    '...KbKKKKKKKKKKBBKKKKKKKKKKbK...',
    '...KbKWWWKKKKKKBBKKKKKKWWWKbK...',
    '...KbKWWWWWKKKKBBKKKKWWWWWKbK...',
    '...KbKWWWWKKWWKBBKWWKKWWWWKbK...',
    '...KbKWWWWKKWWKBBKWWKKWWWWKbK...',
    '...KbKTTTTTTTTKBBKTTTTTTTTKbK...',
    '...KbKKKKKKKKKKBBKKKKKKKKKKbK...',
    '...KYYYYYYYYYYYYYYYYYYYYYYYYK...',
    '...KRRRRRRRRRRRRRRRRRRRRRRRRK...',
    '...KRWYRRRRRRRRRRRRRRRRRRYWRK...',
    '...KRYYRRRKKKKKKKKKKKKRRRYYRK...',
    '...KrRRRRRKWKWKWKWKWKKRRRRRrK...',
    '...KrRRRRRKKKKKKKKKKKKRRRRRrK...',
    '..KLLLLLLLLLLLLLLLLLLLLLLLLLLK..',
    '..KllllllllllllKKllllllllllllK..',
    '...KKKKKKKKKKKKKKKKKKKKKKKKKK...',
    '....KKKK................KKKK....',
    '....KKKK................KKKK....',
  ];
  const bear = [
    '..NN........NN..',
    '.NnnN......NnnN.',
    '.NnNNNNNNNNNNnN.',
    '..NNNNNNNNNNNN..',
    '.NNNKNNNNNNKNNN.',
    '.NNNNNNNNNNNNNN.',
    '.NNNNNyyyyNNNNN.',
    '..NNNyyKKyyNNN..',
    '..NNNNyyyyNNNN..',
    '...NNNNNNNNNN...',
    '..NNNNNNNNNNNN..',
    '.NNNNNNNNNNNNNN.',
    '.NNNNNNNNNNNNNN.',
    '.NNNNNNNNNNNNNN.',
    '..nnn......nnn..',
    '................',
  ];
  const BEAR = { N: '#8c5020', n: '#5c3010', y: '#d8a060' };
  const buch = [
    '..........OO............',
    '.........OWWO...........',
    '.........OOOO...........',
    '........OWWWWO..........',
    '.......OOOOOOOO.........',
    '..KKKKKKKKKKKKKKKKKKKK..',
    '..KLLLLLLLLLLLLLLLLLLK..',
    '..KLTTLLTTLLLLTTLLTTLK..',
    '..KLTTLLTTLLLLTTLLTTLK..',
    '..KLLLLLLLLLLLLLLLLLLK..',
    '..KLKKLLLLLLLLLLLLKKLK..',
    '..KLLKKWWWLLLLWWWKKLLK..',
    '..KLLWWKKWLLLLWKKWWLLK..',
    '..KLLWWKKWLLLLWKKWWLLK..',
    '..KLLLLLLLLLLLLLLLLLLK..',
    '..KLLKKKKKKKKKKKKKKLLK..',
    '..KLLKWKWKWKWKWKWKKLLK..',
    '..KLLKKKKKKKKKKKKKKLLK..',
    '..KLTTLLTTLLLLTTLLTTLK..',
    '..KLTTLLTTLKKLTTLLTTLK..',
    '..KllllllllKKllllllllK..',
    '..KKKKKKKKKKKKKKKKKKKK..',
    '...KKKK..........KKKK...',
    '...KKKK..........KKKK...',
  ];
  // front face from the map, plus the side of the locomotive receding to the right (darker = in shade)
  S.train = (function () {
    const face = make(train);
    const c = document.createElement('canvas');
    c.width = 39; c.height = face.height;
    const x = c.getContext('2d');
    for (let i = 0; i < 10; i++) {
      const top = 6 + Math.floor(i * 0.4), bot = 25 - Math.floor(i * 0.4);
      const w0 = 10 + Math.floor(i * 0.3), w1 = 15 - Math.floor(i * 0.1), stripe = 17 - Math.floor(i * 0.15);
      for (let j = top; j <= bot; j++) {
        let col = j < stripe ? '#0000a8' : j === stripe ? '#c87c00' : '#881400';
        if (j === top || j === bot || i === 9) col = '#000';
        else if (j === top + 1) col = '#7c7c7c';
        else if (j >= w0 && j <= w1 && i % 3 !== 0) col = '#58d8fc';
        x.fillStyle = col; x.fillRect(29 + i, j, 1, 1);
      }
      if (i === 5 || i === 6) { x.fillStyle = '#000'; x.fillRect(29 + i, bot + 1, 1, 2); }
    }
    x.drawImage(face, 0, 0);
    return c;
  })();
  S.bear = make(bear, BEAR);
  S.bearL = flip(S.bear);
  S.bossBuch = make(buch, { T: '#fcd000' });
  S.bossBuchHurt = make(buch, { L: '#fcfcfc', l: '#bcbcbc', T: '#fcfcfc' });
  S.smog1 = make(blob1, { P: '#8c8c8c', p: '#5c5c5c' });
  S.smog2 = make(blob2, { P: '#8c8c8c', p: '#5c5c5c' });
  S.smogFlat = make(blobFlat, { P: '#8c8c8c', p: '#5c5c5c' });

  // grey socialist apartment block with a grid of windows (some lit)
  S.panelBlock = function (ctx, x, y, w, h, seed = 1) {
    ctx.fillStyle = '#8c8c8c'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#6c6c6c'; ctx.fillRect(x + w - 3, y, 3, h);
    let n = seed;
    for (let wy = y + 5; wy < y + h - 8; wy += 9)
      for (let wx = x + 4; wx < x + w - 7; wx += 8) {
        n = (n * 37 + 11) % 101;
        ctx.fillStyle = n % 5 === 0 ? '#fcd000' : '#3c3c5c';
        ctx.fillRect(wx, wy, 4, 5);
      }
  };

  // big stepped silhouette, like a huge palace
  S.parliament = function (ctx, x, y) {
    ctx.fillStyle = '#a8a8a0';
    ctx.fillRect(x, y + 30, 120, 40);
    ctx.fillRect(x + 12, y + 18, 96, 14);
    ctx.fillRect(x + 28, y + 8, 64, 12);
    ctx.fillRect(x + 50, y, 20, 10);
    ctx.fillStyle = '#88887c';
    for (let k = 0; k < 14; k++) ctx.fillRect(x + 4 + k * 8, y + 36, 3, 30);
  };

  // Tampa mountain with the white BRASOV letters
  S.tampa = function (ctx, x, y, w = 200, h = 90) {
    ctx.fillStyle = '#006800';
    ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w * 0.45, y); ctx.lineTo(x + w * 0.6, y + 10); ctx.lineTo(x + w, y + h); ctx.fill();
    ctx.fillStyle = '#00a844';
    for (let k = 0; k < 12; k++) {
      const tx = x + 20 + k * (w - 40) / 12, ty = y + h - 10 - Math.sin(k) * 6;
      ctx.beginPath(); ctx.moveTo(tx, ty - 10); ctx.lineTo(tx - 5, ty + 4); ctx.lineTo(tx + 5, ty + 4); ctx.fill();
    }
    Font.draw(ctx, 'BRASOV', x + w * 0.45, y + 26, '#fff', 1, 'center');
  };

  // train station building with a sign
  S.station = function (ctx, x, y) {
    ctx.fillStyle = '#c8a870'; ctx.fillRect(x, y, 96, 64);
    ctx.fillStyle = '#a07840'; ctx.fillRect(x - 4, y - 6, 104, 8);
    for (let k = 0; k < 4; k++) { ctx.fillStyle = '#3c3c5c'; ctx.fillRect(x + 8 + k * 22, y + 16, 12, 18); }
    ctx.fillStyle = '#000'; ctx.fillRect(x + 38, y + 38, 20, 26);
    ctx.fillStyle = '#2038ec'; ctx.fillRect(x + 6, y + 2, 84, 11);
    Font.draw(ctx, 'GARA DE NORD', x + 48, y + 4, '#fff', 1, 'center');
  };

  window.Sprites = S;
})();
