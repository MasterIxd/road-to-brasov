// Chiptune music and sound effects made with WebAudio. No audio files.
(function () {
  let ac = null, master = null, musicGain = null, sfxGain = null;
  let muted = false;
  try { muted = localStorage.getItem('dqb.muted') === '1'; } catch (e) {}

  const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  function freq(n) {
    const m = /^([A-G]#?)(\d)$/.exec(n);
    if (!m) return 0;
    const midi = 12 * (+m[2] + 1) + NOTE[m[1]];
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  function parse(str) {
    return str.replace(/\|/g, ' ').trim().split(/\s+/).map(t => {
      const [n, b] = t.split(':');
      return [n === 'R' ? 0 : freq(n), parseFloat(b)];
    });
  }

  const SONGS = {
    overworld: {
      bpm: 150,
      lead: 'C5:.5 E5:.5 G5:1 E5:.5 G5:.5 A5:1 G5:.5 E5:.5 C5:.5 D5:.5 E5:2 | F5:.5 A5:.5 C6:1 A5:.5 G5:.5 E5:1 D5:.5 E5:.5 D5:.5 B4:.5 C5:2',
      bass: 'C3:1 G3:1 C3:1 G3:1 F3:1 C4:1 G3:1 G2:1 F3:1 C4:1 F3:1 C4:1 G3:1 D4:1 C3:1 G3:1',
    },
    battle: {
      bpm: 170,
      lead: 'A4:.5 C5:.5 E5:.5 A5:.5 G5:.5 E5:.5 C5:.5 E5:.5 F5:.5 A5:.5 C6:.5 A5:.5 G5:1 E5:1',
      bass: 'A2:.5 A3:.5 A2:.5 A3:.5 A2:.5 A3:.5 A2:.5 A3:.5 F2:.5 F3:.5 F2:.5 F3:.5 G2:.5 G3:.5 G2:.5 G3:.5',
    },
    dungeon: {
      bpm: 110,
      lead: 'D5:1 F5:1 A5:1 G5:.5 F5:.5 E5:2 C5:1 E5:1 | D5:1 F5:1 A5:1 C6:1 A#5:2 A5:2',
      bass: 'D3:2 D3:2 C3:2 C3:2 A#2:2 A#2:2 A2:2 A2:2',
    },
    race: {
      bpm: 180,
      lead: 'E5:.5 E5:.5 G5:.5 E5:.5 A5:.5 G5:.5 E5:.5 D5:.5 C5:.5 D5:.5 E5:.5 G5:.5 E5:1 D5:1 | E5:.5 E5:.5 G5:.5 E5:.5 A5:.5 B5:.5 C6:.5 B5:.5 A5:.5 G5:.5 E5:.5 D5:.5 C5:2',
      bass: 'C3:.5 C4:.5 C3:.5 C4:.5 A2:.5 A3:.5 A2:.5 A3:.5 F2:.5 F3:.5 F2:.5 F3:.5 G2:.5 G3:.5 G2:.5 G3:.5',
    },
    boss: {
      bpm: 160,
      lead: 'E4:.5 F4:.5 E4:.5 D#4:.5 E4:1 B4:1 C5:.5 B4:.5 A#4:.5 B4:.5 E5:2',
      bass: 'E2:.5 E3:.5 E2:.5 E3:.5 E2:.5 E3:.5 E2:.5 E3:.5 F2:.5 F3:.5 F2:.5 F3:.5 E2:.5 E3:.5 E2:.5 E3:.5',
    },
    birthday: {
      bpm: 120,
      lead: 'G4:.75 G4:.25 A4:1 G4:1 C5:1 B4:2 G4:.75 G4:.25 A4:1 G4:1 D5:1 C5:2 G4:.75 G4:.25 G5:1 E5:1 C5:1 B4:1 A4:2 F5:.75 F5:.25 E5:1 C5:1 D5:1 C5:3',
      bass: 'R:1 C3:3 G2:3 G2:3 C3:3 C3:3 F2:3 C3:1 G2:2 C3:3 R:1',
    },
  };

  let current = null, voices = [], timer = null;

  function ensure() {
    if (ac) { if (ac.state !== 'running') { const r = ac.resume(); if (r && r.catch) r.catch(() => {}); } return true; } // iOS also has 'interrupted' (lock screen, call)
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    ac = new AC();
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ac.destination);
    musicGain = ac.createGain(); musicGain.gain.value = 0.35; musicGain.connect(master);
    sfxGain = ac.createGain(); sfxGain.gain.value = 0.6; sfxGain.connect(master);
    return true;
  }

  function blip(f, start, dur, type, vol, dest, slideTo) {
    if (!f) return;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, start);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    g.gain.setValueAtTime(vol, start);
    g.gain.setValueAtTime(vol, start + Math.max(0, dur - 0.03));
    g.gain.linearRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(dest);
    o.start(start); o.stop(start + dur + 0.02);
  }

  function noise(start, dur, vol) {
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ac.createBufferSource();
    const g = ac.createGain(); g.gain.value = vol;
    s.buffer = buf; s.connect(g); g.connect(sfxGain); s.start(start);
  }

  function schedule() {
    if (!current || !ac) return;
    const song = SONGS[current];
    const beat = 60 / song.bpm;
    const ahead = ac.currentTime + 0.25;
    for (const v of voices) {
      while (v.next < ahead) {
        const [f, b] = v.notes[v.i];
        blip(f, v.next, b * beat * 0.9, v.type, v.vol, musicGain);
        v.next += b * beat;
        v.i = (v.i + 1) % v.notes.length;
      }
    }
  }

  const Audio = {
    unlock() { ensure(); if (current && !timer) Audio.music(current, true); },

    music(name, force) {
      if (name === current && !force) return;
      current = name;
      voices = [];
      if (timer) { clearInterval(timer); timer = null; }
      if (!name || !ensure()) return;
      const song = SONGS[name];
      const t0 = ac.currentTime + 0.05;
      voices.push({ notes: parse(song.lead), i: 0, next: t0, type: 'square', vol: 0.18 });
      voices.push({ notes: parse(song.bass), i: 0, next: t0, type: 'triangle', vol: 0.45 });
      timer = setInterval(schedule, 50);
      schedule();
    },

    stopMusic() { Audio.music(null); },

    sfx(name) {
      if (!ensure()) return;
      const t = ac.currentTime;
      const D = sfxGain;
      switch (name) {
        case 'jump': blip(260, t, 0.16, 'square', 0.25, D, 720); break;
        case 'coin': blip(988, t, 0.07, 'square', 0.25, D); blip(1319, t + 0.07, 0.25, 'square', 0.25, D); break;
        case 'stomp': blip(440, t, 0.1, 'square', 0.3, D, 110); break;
        case 'bump': blip(150, t, 0.08, 'triangle', 0.5, D, 80); break;
        case 'hurt': blip(600, t, 0.4, 'square', 0.25, D, 80); break;
        case 'select': blip(880, t, 0.05, 'square', 0.2, D); break;
        case 'confirm': blip(660, t, 0.06, 'square', 0.2, D); blip(990, t + 0.06, 0.08, 'square', 0.2, D); break;
        case 'wrong': blip(120, t, 0.35, 'sawtooth', 0.2, D, 90); break;
        case 'hit': noise(t, 0.15, 0.4); blip(300, t, 0.12, 'square', 0.2, D, 90); break;
        case 'sword': noise(t, 0.08, 0.25); blip(1200, t, 0.08, 'square', 0.1, D, 400); break;
        case 'crash': noise(t, 0.35, 0.5); break;
        case 'boost': blip(300, t, 0.3, 'square', 0.2, D, 1200); break;
        case 'item': ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => blip(freq(n), t + i * 0.08, 0.1, 'square', 0.22, D)); break;
        case 'secret': ['C5', 'G5', 'E5', 'C6', 'D5', 'A5', 'F5', 'D6', 'E6'].forEach((n, i) => blip(freq(n), t + i * 0.09, 0.1, 'square', 0.2, D)); break;
        case 'door': blip(200, t, 0.3, 'triangle', 0.5, D, 60); noise(t, 0.3, 0.2); break;
        case 'clear': ['C5', 'E5', 'G5', 'C6', 'G5', 'C6'].forEach((n, i) => blip(freq(n), t + i * 0.1, i === 5 ? 0.5 : 0.1, 'square', 0.22, D)); break;
        case 'fanfare':
          [['C5', 0, .15], ['C5', .15, .15], ['C5', .3, .15], ['C5', .45, .45], ['G#4', .9, .45], ['A#4', 1.35, .45], ['C5', 1.8, .3], ['A#4', 2.1, .15], ['C5', 2.25, 1]]
            .forEach(([n, s, d]) => blip(freq(n), t + s, d, 'square', 0.25, D));
          break;
        case 'count': blip(440, t, 0.15, 'square', 0.25, D); break;
        case 'go': blip(880, t, 0.4, 'square', 0.25, D); break;
      }
    },

    isMuted() { return muted; },
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('dqb.muted', muted ? '1' : '0'); } catch (e) {}
      ensure();
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
  };

  window.GameAudio = Audio;
})();
