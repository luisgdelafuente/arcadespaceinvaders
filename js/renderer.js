// Presentation: the game renders monochrome-white to a fixed 224x256 buffer,
// which is upscaled to the display canvas at an integer factor with
// nearest-neighbor sampling. CRT character is layered on restrained:
// phosphor tint, faint bloom, scanlines, vignette, occasional flicker, and an
// optional colored-cellophane overlay like physical cabinet strips.

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.dctx = canvas.getContext('2d');
    this.buffer = document.createElement('canvas');
    this.buffer.width = CONFIG.WIDTH;
    this.buffer.height = CONFIG.HEIGHT;
    this.gctx = this.buffer.getContext('2d');
    this.scale = 1;
    this.overlay = false;   // colored band overlay (O key)
    this.bloom = true;
    this.flickerT = 0;
    this.scanlinesEl = document.getElementById('scanlines');
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('fullscreenchange', () => this.resize());
    this.resize();
  }

  resize() {
    const s = Math.max(1, Math.min(
      Math.floor(window.innerWidth * 0.98 / CONFIG.WIDTH),
      Math.floor(window.innerHeight * 0.98 / CONFIG.HEIGHT)));
    this.scale = s;
    this.canvas.width = CONFIG.WIDTH * s;
    this.canvas.height = CONFIG.HEIGHT * s;
    this.dctx.imageSmoothingEnabled = false;
    if (this.scanlinesEl) {
      this.scanlinesEl.style.background = s >= 2
        ? 'repeating-linear-gradient(to bottom, rgba(255,255,255,1) 0px, ' +
          'rgba(255,255,255,1) ' + (s - 1) + 'px, rgba(190,205,195,1) ' +
          (s - 1) + 'px, rgba(190,205,195,1) ' + s + 'px)'
        : 'none';
    }
  }

  toggleFullscreen() {
    const frame = document.getElementById('frame');
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (frame.requestFullscreen) {
      frame.requestFullscreen().catch(() => {});
    }
  }

  present(game) {
    const g = this.gctx;
    game.draw(g);

    // Tinting happens on the low-res buffer so bands stay pixel-aligned.
    g.save();
    // Faint green-white phosphor cast over the whole tube.
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = 'rgb(228,255,236)';
    g.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    if (this.overlay) {
      // Cabinet cellophane strips: translucent warm band over the
      // bonus-craft lane, green band over shields, cannon, and baseline.
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 0.16;
      g.fillStyle = 'rgb(255,120,80)';
      g.fillRect(0, 22, CONFIG.WIDTH, 42);
      g.fillStyle = 'rgb(80,255,110)';
      g.fillRect(0, 184, CONFIG.WIDTH, 72);
    }
    g.restore();

    const d = this.dctx;
    const w = this.canvas.width, h = this.canvas.height;
    d.clearRect(0, 0, w, h);
    d.fillStyle = '#000';
    d.fillRect(0, 0, w, h);

    // Occasional single-frame brightness dip plus tiny constant shimmer.
    if (this.flickerT > 0) this.flickerT--;
    else if (Math.random() < 0.004) this.flickerT = 2;
    const alpha = (this.flickerT > 0 ? 0.90 : 1) - Math.random() * 0.03;

    d.imageSmoothingEnabled = false;
    // Subtle bloom: one blurred low-alpha pass under the crisp image.
    if (this.bloom && typeof d.filter === 'string') {
      d.globalAlpha = 0.28 * alpha;
      d.filter = 'blur(' + Math.max(1, this.scale * 0.55) + 'px)';
      d.drawImage(this.buffer, 0, 0, w, h);
      d.filter = 'none';
    }
    d.globalAlpha = alpha;
    d.drawImage(this.buffer, 0, 0, w, h);
    d.globalAlpha = 1;
  }
}
