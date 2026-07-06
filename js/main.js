// Bootstrap and the fixed-timestep main loop. Logic always advances at
// 60 ticks/s regardless of display refresh, so movement is consistent on
// 60/120/144 Hz screens alike.

(function () {
  const TICK_MS = 1000 / 60;

  function start() {
    buildSprites();

    const audio = new AudioEngine();
    const renderer = new Renderer(document.getElementById('screen'));
    const scores = new HighScores();
    const input = new Input({
      // Audio can only start from a user gesture.
      onAny: () => audio.unlock(),
      // Fullscreen must also be requested inside the gesture handler.
      onKeyDown: (code) => { if (code === 'KeyF') renderer.toggleFullscreen(); },
    });
    input.attach();

    const game = new Game(audio, input, scores, renderer);

    document.getElementById('fsBtn').addEventListener('click', () => {
      audio.unlock();
      renderer.toggleFullscreen();
    });
    window.addEventListener('blur', () => game.autoPause());

    // Exposed for debugging and automated play-testing.
    window.game = game;
    window.gameRenderer = renderer;
    window.gameAudio = audio;

    let last = performance.now();
    let acc = 0;
    function frame(now) {
      let dt = now - last;
      last = now;
      if (dt > 250) dt = 250; // tab was hidden — don't spiral
      acc += dt;
      while (acc >= TICK_MS) {
        game.tick();
        input.endTick();
        acc -= TICK_MS;
      }
      renderer.present(game);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
