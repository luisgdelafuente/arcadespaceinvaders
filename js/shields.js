// Destructible shields. Each shield keeps a per-pixel mask (for collision)
// and a matching small canvas (for drawing). Impacts stamp out a blast
// pattern plus a little random fringe, so bunkers crumble like the originals.

class Shield {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const src = Sprites.shield;
    this.w = src.w;
    this.h = src.h;
    this.mask = new Uint8Array(this.w * this.h);
    for (let ry = 0; ry < this.h; ry++) {
      const row = src.rows[ry];
      for (let rx = 0; rx < row.length; rx++) {
        if (row[rx] === 'X') this.mask[ry * this.w + rx] = 1;
      }
    }
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.w;
    this.canvas.height = this.h;
    this.g = this.canvas.getContext('2d');
    this.g.fillStyle = CONFIG.COLORS.shield;
    this.g.fillRect(0, 0, this.w, this.h);
    // Punch out the empty pixels of the template shape.
    for (let i = 0; i < this.mask.length; i++) {
      if (!this.mask[i]) this.g.clearRect(i % this.w, (i / this.w) | 0, 1, 1);
    }
  }

  solid(lx, ly) {
    return lx >= 0 && ly >= 0 && lx < this.w && ly < this.h &&
           this.mask[ly * this.w + lx] === 1;
  }

  _clearPixel(lx, ly) {
    if (lx < 0 || ly < 0 || lx >= this.w || ly >= this.h) return;
    if (this.mask[ly * this.w + lx]) {
      this.mask[ly * this.w + lx] = 0;
      this.g.clearRect(lx, ly, 1, 1);
    }
  }

  // First solid pixel under a world-space rect, scanning top-down (dir=1,
  // enemy bombs) or bottom-up (dir=-1, player shots). Returns {x, y} local.
  probeRect(wx, wy, ww, wh, dir) {
    const x0 = Math.max(0, Math.floor(wx - this.x));
    const x1 = Math.min(this.w - 1, Math.ceil(wx + ww - 1 - this.x));
    let y0 = Math.max(0, Math.floor(wy - this.y));
    let y1 = Math.min(this.h - 1, Math.ceil(wy + wh - 1 - this.y));
    if (x0 > x1 || y0 > y1) return null;
    if (dir < 0) { const t = y0; y0 = y1; y1 = t; }
    for (let ly = y0; dir < 0 ? ly >= y1 : ly <= y1; ly += dir) {
      for (let lx = x0; lx <= x1; lx++) {
        if (this.mask[ly * this.w + lx]) return { x: lx, y: ly };
      }
    }
    return null;
  }

  // Stamp a blast pattern (rows of 'X') centered on a local pixel.
  carvePattern(lx, ly, pattern) {
    const ph = pattern.length;
    const pw = pattern[0].length;
    const ox = lx - (pw >> 1);
    const oy = ly - (ph >> 1);
    for (let ry = 0; ry < ph; ry++) {
      for (let rx = 0; rx < pw; rx++) {
        if (pattern[ry][rx] === 'X') this._clearPixel(ox + rx, oy + ry);
      }
    }
    // Ragged fringe: a few extra random pixels just outside the stamp.
    for (let i = 0; i < 5; i++) {
      this._clearPixel(
        ox + ((Math.random() * (pw + 2)) | 0) - 1,
        oy + ((Math.random() * (ph + 2)) | 0) - 1);
    }
  }

  // Erase everything under a world-space rect (aliens plowing through).
  carveRect(wx, wy, ww, wh) {
    const x0 = Math.max(0, Math.floor(wx - this.x));
    const x1 = Math.min(this.w - 1, Math.ceil(wx + ww - 1 - this.x));
    const y0 = Math.max(0, Math.floor(wy - this.y));
    const y1 = Math.min(this.h - 1, Math.ceil(wy + wh - 1 - this.y));
    for (let ly = y0; ly <= y1; ly++) {
      for (let lx = x0; lx <= x1; lx++) this._clearPixel(lx, ly);
    }
  }

  draw(g) {
    g.drawImage(this.canvas, this.x, this.y);
  }
}

function buildShields() {
  return CONFIG.SHIELD_XS.map(x => new Shield(x, CONFIG.SHIELD_Y));
}
