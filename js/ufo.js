// The bonus craft. Appears periodically while enough of the formation
// remains, drifts across the top, and pays out a hidden score drawn from a
// table indexed by the player's total shot count — the classic quirk.

class Ufo {
  constructor() {
    this.active = false;
    this.x = 0;
    this.dir = 1;
    this.timer = CONFIG.UFO_INTERVAL;
    this.w = Sprites.ufo.w;
    this.h = Sprites.ufo.h;
    this.y = CONFIG.UFO_Y;
  }

  update(game) {
    if (!this.active) {
      if (--this.timer <= 0 && game.formation.liveCount >= CONFIG.UFO_MIN_ALIENS) {
        this.active = true;
        this.dir = (game.shotsFired & 1) ? -1 : 1;
        this.x = this.dir > 0 ? -this.w : CONFIG.WIDTH;
        game.audio.ufoStart();
      }
      return;
    }
    this.x += CONFIG.UFO_SPEED * this.dir;
    if (this.x < -this.w - 2 || this.x > CONFIG.WIDTH + 2) {
      this.abort(game);
    }
  }

  // Quietly remove (flew off / state change).
  abort(game) {
    if (this.active) {
      this.active = false;
      this.timer = CONFIG.UFO_INTERVAL;
      game.audio.ufoStop();
    }
  }

  // Shot down: explosion, hidden score value revealed at the spot.
  destroy(game) {
    const score = CONFIG.UFO_SCORES[game.shotsFired % CONFIG.UFO_SCORES.length];
    const ix = this.x | 0;
    game.effects.addSprite('ufoboom', ix, this.y, 24);
    game.effects.addText(String(score), ix + 2, this.y, 80, true, CONFIG.COLORS.ufo);
    game.audio.ufoHit();
    this.active = false;
    this.timer = CONFIG.UFO_INTERVAL;
    return score;
  }

  draw(g) {
    if (this.active) drawSprite(g, 'ufo', this.x, this.y);
  }
}
