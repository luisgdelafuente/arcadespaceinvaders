// Presentation: the game renders to a fixed 224x256 buffer, which is
// upscaled to the display canvas at an integer factor of DEVICE pixels
// (nearest-neighbor), so the image is crisp on any screen density —
// desktop monitors and high-DPI phones alike. CRT character is layered on
// restrained: phosphor tint, faint bloom, pixel-aligned scanlines, vignette,
// occasional flicker, and an optional colored-cellophane overlay mode.

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
    this.scanPattern = null;
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => this.resize());
    document.addEventListener('fullscreenchange', () => this.resize());
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this.resize());
    }
    this.resize();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const stage = document.getElementById('stage');
    let availW = window.innerWidth;
    let availH = window.innerHeight;
    if (!document.fullscreenElement && stage && stage.clientWidth > 0) {
      availW = stage.clientWidth;
      availH = stage.clientHeight;
    }
    availW *= 0.98;
    availH *= 0.98;
    // Integer scale in device pixels; CSS size maps it back to layout pixels.
    const s = Math.max(1, Math.floor(Math.min(
      availW * dpr / CONFIG.WIDTH, availH * dpr / CONFIG.HEIGHT)));
    this.scale = s;
    this.canvas.width = CONFIG.WIDTH * s;
    this.canvas.height = CONFIG.HEIGHT * s;
    this.canvas.style.width = (CONFIG.WIDTH * s / dpr) + 'px';
    this.canvas.style.height = (CONFIG.HEIGHT * s / dpr) + 'px';
    this.dctx.imageSmoothingEnabled = false;
    this._buildScanPattern();
  }

  // One dark line per game pixel row, aligned to the integer device scale.
  _buildScanPattern() {
    const s = this.scale;
    if (s < 3) { this.scanPattern = null; return; }
    const tile = document.createElement('canvas');
    tile.width = 1;
    tile.height = s;
    const g = tile.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,0.20)';
    g.fillRect(0, s - 1, 1, 1);
    this.scanPattern = this.dctx.createPattern(tile, 'repeat');
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

    if (this.scanPattern) {
      d.fillStyle = this.scanPattern;
      d.fillRect(0, 0, w, h);
    }
  }
}
