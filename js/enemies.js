// The enemy formation. Movement is authentically rippled: exactly one alien
// advances per tick, cycling from the bottom row upward, so the whole grid
// crawls when full and races when nearly empty — the speed-up is emergent,
// no explicit speed table needed. The final survivor steps wider going right.

const ALIEN_TYPES = [
  { key: 'octo' },   // type 0, bottom rows
  { key: 'crab' },   // type 1, middle rows
  { key: 'squid' },  // type 2, top row
];

function alienTypeForRow(row) {
  if (row === 0) return 2;
  return row < 3 ? 1 : 0;
}

class Formation {
  constructor(wave) {
    this.startY = CONFIG.WAVE_START_Y[
      Math.min(wave - 1, CONFIG.WAVE_START_Y.length - 1)];
    this.aliens = [];
    // Bottom row first so the movement ripple runs bottom-left to top-right.
    for (let row = CONFIG.ALIEN_ROWS - 1; row >= 0; row--) {
      for (let col = 0; col < CONFIG.ALIEN_COLS; col++) {
        const type = alienTypeForRow(row);
        const spr = Sprites[ALIEN_TYPES[type].key + '0'];
        this.aliens.push({
          col, row, type,
          w: spr.w, h: spr.h,
          x: CONFIG.FORMATION_X + col * CONFIG.CELL_W + ((CONFIG.CELL_W - spr.w) >> 1),
          y: this.startY + row * CONFIG.CELL_H,
          frame: 0,
          alive: true,
        });
      }
    }
    this.liveCount = this.aliens.length;
    this.cursor = 0;
    this.dir = 1;
    this.dropping = false;
    this.edgeFlag = false;
    this.pause = 0;        // freeze after a kill (classic beat)
    this.invasion = false; // set when a drop crosses the defense line
    this.passStarted = false;
  }

  // Advance exactly one live alien. Called once per tick while playing.
  update(game) {
    if (this.pause > 0) { this.pause--; return; }
    if (this.liveCount === 0) return;
    let guard = this.aliens.length + 1;
    while (guard-- > 0) {
      if (this.cursor >= this.aliens.length) this._beginPass(game);
      const a = this.aliens[this.cursor++];
      if (a.alive) {
        this._moveAlien(a);
        return;
      }
    }
  }

  _beginPass(game) {
    this.cursor = 0;
    if (this.edgeFlag) {
      this.dir = -this.dir;
      this.dropping = true;
      this.edgeFlag = false;
    } else {
      this.dropping = false;
    }
    game.onFormationStep();
  }

  _moveAlien(a) {
    let step = CONFIG.ALIEN_STEP_X;
    if (this.liveCount === 1 && this.dir > 0) step = CONFIG.LAST_ALIEN_FAST_STEP;
    a.x += step * this.dir;
    if (this.dropping) {
      a.y += CONFIG.ALIEN_DROP_Y;
      if (a.y + a.h >= CONFIG.INVASION_Y) this.invasion = true;
    }
    a.frame ^= 1;
    if (this.dir < 0 && a.x <= 4) this.edgeFlag = true;
    if (this.dir > 0 && a.x + a.w >= CONFIG.WIDTH - 4) this.edgeFlag = true;
  }

  kill(a) {
    a.alive = false;
    this.liveCount--;
    this.pause = CONFIG.DEATH_PAUSE_TICKS;
  }

  hitTest(x, y, w, h) {
    for (const a of this.aliens) {
      if (a.alive && rectsOverlap(x, y, w, h, a.x, a.y, a.w, a.h)) return a;
    }
    return null;
  }

  liveColumns() {
    const cols = [];
    for (let c = 0; c < CONFIG.ALIEN_COLS; c++) {
      if (this.bottomAlienOfColumn(c)) cols.push(c);
    }
    return cols;
  }

  bottomAlienOfColumn(col) {
    let best = null;
    for (const a of this.aliens) {
      if (a.alive && a.col === col && (!best || a.y > best.y)) best = a;
    }
    return best;
  }

  // Center x of the bottom alien in the column nearest a given x.
  nearestColumnX(x) {
    let best = null, bestDist = Infinity;
    for (const c of this.liveColumns()) {
      const a = this.bottomAlienOfColumn(c);
      const cx = a.x + (a.w >> 1);
      const d = Math.abs(cx - x);
      if (d < bestDist) { bestDist = d; best = cx; }
    }
    return best;
  }

  lowestY() {
    let y = -Infinity;
    for (const a of this.aliens) if (a.alive) y = Math.max(y, a.y + a.h);
    return y;
  }

  // After an invasion costs a life, push the formation back to wave height,
  // always leaving the lowest rank clearly above the defense line.
  liftToStart() {
    let top = Infinity;
    for (const a of this.aliens) if (a.alive) top = Math.min(top, a.y);
    if (top === Infinity) return;
    const delta = Math.max(
      top - this.startY,
      this.lowestY() - (CONFIG.INVASION_Y - 24));
    if (delta > 0) for (const a of this.aliens) a.y -= delta;
    this.invasion = false;
  }

  // Aliens grind away any shield pixels they overlap.
  carveShields(shields) {
    if (this.lowestY() < CONFIG.SHIELD_Y) return;
    for (const a of this.aliens) {
      if (!a.alive || a.y + a.h < CONFIG.SHIELD_Y) continue;
      for (const s of shields) {
        if (rectsOverlap(a.x, a.y, a.w, a.h, s.x, s.y, s.w, s.h)) {
          s.carveRect(a.x, a.y, a.w, a.h);
        }
      }
    }
  }

  draw(g) {
    for (const a of this.aliens) {
      if (a.alive) drawSprite(g, ALIEN_TYPES[a.type].key + a.frame, a.x, a.y);
    }
  }
}
