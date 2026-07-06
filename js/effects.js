// Short-lived visuals: pixel explosion sprites and score popups.

class Effects {
  constructor() {
    this.sprites = [];  // { names[], x, y, t, dur, rate }
    this.texts = [];    // { text, x, y, t, dur, blink }
  }

  addSprite(names, x, y, dur, rate) {
    this.sprites.push({
      names: Array.isArray(names) ? names : [names],
      x, y, t: 0, dur, rate: rate || 8,
    });
  }

  addText(text, x, y, dur, blink) {
    this.texts.push({ text, x, y, t: 0, dur, blink: !!blink });
  }

  update() {
    for (const e of this.sprites) e.t++;
    for (const e of this.texts) e.t++;
    this.sprites = this.sprites.filter(e => e.t < e.dur);
    this.texts = this.texts.filter(e => e.t < e.dur);
  }

  draw(g) {
    for (const e of this.sprites) {
      const frame = ((e.t / e.rate) | 0) % e.names.length;
      drawSprite(g, e.names[frame], e.x, e.y);
    }
    for (const e of this.texts) {
      if (e.blink && ((e.t >> 4) & 1)) continue;
      drawText(g, e.text, e.x, e.y);
    }
  }

  clear() {
    this.sprites.length = 0;
    this.texts.length = 0;
  }
}
