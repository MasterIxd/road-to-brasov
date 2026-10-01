// Boot: wire up the sound button and start the game.
(function () {
  const mute = document.getElementById('mute');        // SOUND on the touch pad
  const muteKey = document.getElementById('mute-key'); // "M = sound" in the keyboard hint, also clickable
  const paint = () => {
    const off = GameAudio.isMuted();
    mute.classList.toggle('off', off);
    muteKey.classList.toggle('off', off);
    muteKey.textContent = 'M = sound: ' + (off ? 'off' : 'on');
  };
  const toggle = () => { GameAudio.toggleMute(); paint(); };
  mute.addEventListener('click', toggle);
  // a finger on the pad never becomes a click (input.js cancels touchstart there), so take the touch itself
  mute.addEventListener('touchstart', e => { e.preventDefault(); toggle(); }, { passive: false });
  muteKey.addEventListener('click', toggle);
  window.addEventListener('keydown', e => { if (e.code === 'KeyM' && !e.repeat) toggle(); });
  paint();

  // iOS only allows audio after a user gesture
  Input.onFirstInteraction = () => GameAudio.unlock();

  Game.start();
})();
